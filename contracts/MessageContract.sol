// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MessageContract {
    string private message;

    // Initialisation avec un message par défaut
    constructor(string memory _initialMessage) {
        message = _initialMessage;
    }

    // Récupérer le message actuel
    function getMessage() public view returns (string memory) {
        return message;
    }

    // Mettre à jour le message
    function setMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}
