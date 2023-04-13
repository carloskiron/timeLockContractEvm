// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Hashed Timelock Contract - ERC20 tokens.
 *
 */
contract TimeLock {
    event Locked(
        bytes32 indexed txId,
        address indexed sender,
        address indexed receiver,
        address tokenContract,
        uint256 amount,
        bytes32 hashlock,
        uint256 expirationBlock
    );
    event Unlocked(bytes32 indexed txId);
    event Canceled(bytes32 indexed txId);

    struct LockDetails {
        address sender;
        address receiver;
        address tokenContract;
        uint256 amount;
        bytes32 hashlock;
        uint256 expirationBlock;
        bool withdrawn;
        bool refunded;
        bytes32 preimage;
    }

    modifier tokensTransferable(
        address _token,
        address _sender,
        uint256 _amount
    ) {
        require(_amount > 0, "token amount must be > 0");
        require(
            ERC20(_token).allowance(_sender, address(this)) >= _amount,
            "token allowance must be >= amount"
        );
        _;
    }
    modifier futureTimelock(uint256 _time) {
        require(
            _time + block.number > block.number,
            "timelock time must be in the future"
        );
        _;
    }
    modifier LockDetailsExists(bytes32 txId) {
        require(haveLockDetails(txId), "contractId does not exist");
        _;
    }
    modifier hashlockMatches(bytes32 _txId, bytes32 _x) {
        require(
            transactions[_txId].hashlock == sha256(abi.encodePacked(_x)),
            "hashlock hash does not match"
        );
        _;
    }
    modifier withdrawable(bytes32 _txId) {
        require(
            transactions[_txId].receiver == msg.sender,
            "withdrawable: not receiver"
        );
        require(
            transactions[_txId].withdrawn == false,
            "withdrawable: already withdrawn"
        );
        // This check needs to be added if claims are allowed after timeout. That is, if the following timelock check is commented out
        require(
            transactions[_txId].refunded == false,
            "withdrawable: already refunded"
        );
        // if we want to disallow claim to be made after the timeout, uncomment the following line
        // require(contracts[_txId].expirationBlock > block.number, "withdrawable: timelock time must be in the future");
        _;
    }
    modifier refundable(bytes32 _txId) {
        require(
            transactions[_txId].sender == msg.sender,
            "refundable: not sender"
        );
        require(
            transactions[_txId].refunded == false,
            "refundable: already refunded"
        );
        require(
            transactions[_txId].withdrawn == false,
            "refundable: already withdrawn"
        );
        require(
            transactions[_txId].expirationBlock <= block.number,
            "refundable: timelock not yet passed"
        );
        _;
    }

    mapping(bytes32 => LockDetails) transactions;

    /**
     * @dev Sender / Payer sets up a new hash time lock contract depositing the
     * funds and providing the reciever and terms.
     *
     * NOTE: _receiver must first call approve() on the token contract.
     *       See allowance check in tokensTransferable modifier.

     * @param _receiver Receiver of the tokens.
     * @param _hashlock A sha-2 sha256 hash hashlock.
     * @param _timelock UNIX epoch seconds time that the lock expires at.
     *                  Refunds can be made after this time.
     * @param _tokenContract ERC20 Token contract address.
     * @param _amount Amount of the token to lock up.
     * @return txId Id of the new HTLC. This is needed for subsequent
     *                    calls.
     */
    function lock(
        address _receiver,
        bytes32 _hashlock,
        uint256 _timelock,
        address _tokenContract,
        uint256 _amount
    )
        external
        tokensTransferable(_tokenContract, msg.sender, _amount)
        futureTimelock(_timelock)
        returns (bytes32 txId)
    {
        // Calculate the timelock expiration block
        uint256 expirationBlock = _timelock + block.number;

        txId = sha256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                _tokenContract,
                _amount,
                _hashlock,
                expirationBlock
            )
        );

        // Reject if a transaction already exists with the same parameters. The
        if (haveLockDetails(txId)) revert("Lock details already exists");

        // This contract becomes the temporary owner of the tokens
        if (
            !ERC20(_tokenContract).transferFrom(
                msg.sender,
                address(this),
                _amount
            )
        ) revert("transferFrom sender to this failed");

        transactions[txId] = LockDetails(
            msg.sender,
            _receiver,
            _tokenContract,
            _amount,
            _hashlock,
            expirationBlock,
            false,
            false,
            0x0
        );

        emit Locked(
            txId,
            msg.sender,
            _receiver,
            _tokenContract,
            _amount,
            _hashlock,
            expirationBlock
        );
    }

    /**
     * @dev Called by the receiver once they know the preimage of the hashlock.
     * This will transfer ownership of the locked tokens to their address.
     *
     * @param _txId Id of the HTLC.
     * @param _preimage sha256(_preimage) should equal the contract hashlock.
     * @return bool true on success
     */
    function unlock(
        bytes32 _txId,
        bytes32 _preimage
    )
        external
        LockDetailsExists(_txId)
        hashlockMatches(_txId, _preimage)
        withdrawable(_txId)
        returns (bool)
    {
        LockDetails storage c = transactions[_txId];
        c.preimage = _preimage;
        c.withdrawn = true;
        ERC20(c.tokenContract).transfer(c.receiver, c.amount);
        emit Unlocked(_txId);
        return true;
    }

    /**
     * @dev Called by the sender if there was no withdraw AND the time lock has
     * expired. This will restore ownership of the tokens to the sender.
     *
     * @param _txId Id of HTLC to refund from.
     * @return bool true on success
     */
    function cancel(
        bytes32 _txId
    ) external LockDetailsExists(_txId) refundable(_txId) returns (bool) {
        LockDetails storage c = transactions[_txId];
        c.refunded = true;
        ERC20(c.tokenContract).transfer(c.sender, c.amount);
        emit Canceled(_txId);
        return true;
    }

    /**
     * @dev Get contract details.
     * @param _txId HTLC contract id
     * @return sender
     * @return receiver
     * @return tokenContract
     * @return amount
     * @return hashlock
     * @return expirationBlock
     * @return withdrawn
     * @return refunded
     * @return preimage
     */
    function getTransactionDetails(
        bytes32 _txId
    )
        public
        view
        returns (
            address sender,
            address receiver,
            address tokenContract,
            uint256 amount,
            bytes32 hashlock,
            uint256 expirationBlock,
            bool withdrawn,
            bool refunded,
            bytes32 preimage
        )
    {
        if (haveLockDetails(_txId) == false)
            return (
                address(0),
                address(0),
                address(0),
                0,
                0,
                0,
                false,
                false,
                0
            );
        LockDetails storage txDetails = transactions[_txId];
        return (
            txDetails.sender,
            txDetails.receiver,
            txDetails.tokenContract,
            txDetails.amount,
            txDetails.hashlock,
            txDetails.expirationBlock,
            txDetails.withdrawn,
            txDetails.refunded,
            txDetails.preimage
        );
    }

    /**
     * @dev Is there a transaction with id _txId.
     * @param _txId Id into transactions mapping.
     */
    function haveLockDetails(
        bytes32 _txId
    ) internal view returns (bool exists) {
        exists = (transactions[_txId].sender != address(0));
    }
}
