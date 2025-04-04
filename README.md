# Description du projet

Le projet est une application de vote décentralisée qui intègre un contrat intelligent en Solidity et une interface web basée sur React. Il utilise Javascript, Typescript, npm et Yarn pour la gestion et le développement front-end.

## Répartition des tâches

Pour ce qui est de la répartition des tâches, le projet est divisé en deux parties principales :
- **Backend** : Majoritairement Mathys R (Ayant passé plus de temps sur CryptoZombies).
- **Frontend** : Majoritairement Nathan D (Ayant une expérience et des affinités plus importantes).

## Fonctionnalités principales

- **Inscription des électeurs**  
  Enregistrement des électeurs permettant leur participation au vote.

- **Propositions de vote**  
  Gestion des propositions avec une première proposition vide pour que les identifiants commencent à 1.

- **Vote et comptage automatique**  
  Permet de voter pour une proposition et compte les votes délégués. Les votes délégués sont automatiquement ajoutés si l’électeur responsable a déjà voté.

- **Déclaration de fin de session de vote et ramassage des votes**  
  Possibilité de clôturer la session de vote et de comptabiliser les votes pour déterminer la proposition gagnante via des fonctions dédiées.

- **Délégation de vote**  
  Possède une fonction de délégation de vote avec détection des boucles de délégation et transfert immédiat du vote en cas de vote déjà effectué par le délégué.

- **Gestion des phases et délais**  
  Implémente des phases de vote (inscription, enregistrement de propositions, vote, etc.) avec possibilité de définir un délai pour chaque phase. Une fonction de contrôle met à jour automatiquement la phase lorsque la date limite est dépassée.

- **Évènements**  
  Différents évènements sont déclenchés pour notifier les changements d’état (ex. : changement de phase, délégation de vote).

## Structure du contrat

Le contrat intelligent est défini dans le fichier `backend/contracts/Voting.sol` et comprend :
- La gestion des propositions et des votes associés.
- Un système de contrôle de flux via l’énumération des états (WorkflowStatus).
- Des fonctions pour la délégation de vote, le vote, le changement d’état et le comptage des votes.

## Intégration front-end

La partie front-end est construite avec React et interagit avec le contrat intelligent pour :
- Afficher les propositions et l’état du vote.
- Permettre aux utilisateurs d’enregistrer leur vote ou de déléguer leur vote.
- Mettre à jour l’interface en fonction des différents états du workflow.

Ce projet combine ainsi des technologies blockchain et web pour offrir une solution complète de vote décentralisé.

## Lien vers la vidéo de présentation

[Video de présentation](https://youtu.be/Ke_pCBRQMQQ)
