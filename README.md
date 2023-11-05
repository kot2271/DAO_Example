# DAO

## Задача:
    Реализовать смарт-контракт DAO по схеме
    
![schema](https://github.com/kot2271/DAO_Example/blob/main/schema/schema.png)

    Необходимо реализовать:
    - Смарт-контракт ERC-20
    - Смарт-контракт DAO

    Обязательные функции внутри смарт-контракта DAO:
    - deposit
    - addProposal
    - withdraw (вывод)
    - finishProposal
    - vote (голосовать)

    Описание:
    Пользователь может участвовать в нескольких голосованиях одновременно.
    Один депозитный токен равен одному голосу.
    Пользователь, участвующий в голосовании, голосует всеми своими токенами.

    Если пользователь участвует в нескольких голосованиях одновременно, он участвует во всех голосованиях всеми своими токенами.
    Пользователь не может снять свои токены, пока не закончатся все голосования, в которых он принимал участие.

    DAO контракт должен содержать подпись (encodeWithSignature) и иметь возможность вызвать какую-либо функцию в другом контракте.

    DAO контракт должен иметь constructor('Chairperson', токен для голосования, минимальный кворум, продолжительность дебатов).

    Должна быть отдельная роль 'Chairperson', только роль 'Chairperson' может запускать функцию 'addProposal(calldata, recipient, description)'.

## Installation

Clone the repository using the following command:
Install the dependencies using the following command:
```shell
npm i
```

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (polygon-mumbai):
```shell
npx hardhat run scripts/deploy.ts --network polygon-mumbai
```

## Verify

Verify the installation by running the following command:
```shell
npx hardhat verify --network polygon-mumbai {TOKEN_ADDRESS} "MyToken" "T3T"
```

## Tasks

Create a new task(s) and save it(them) in the folder "tasks". Add a new task_name in the file "tasks/index.ts"

Running a addProposal task:
```shell
npx hardhat addProposal --dao {DAO_CONTRACT_ADDRESS} --recipient {RECIPIENT_ADDRESS} --description {STRING_DESCRIPTION} --network polygon-mumbai
```

Running a approve task:
```shell
npx hardhat approve --token {TOKEN_ADDRESS} --dao-contract {DAO_CONTRACT_ADDRESS} --amount 20 --network polygon-mumbai
```

Running a deposit task:
```shell
npx hardhat deposit --dao {DAO_CONTRACT_ADDRESS} --amount 20 --network polygon-mumbai
```

Running a vote task:
```shell
npx hardhat vote --dao {DAO_CONTRACT_ADDRESS} --proposal-id {PROPOSAL_ID} --support {"true"/"false"} --network polygon-mumbai
```

Running a finishProposal task:
```shell
npx hardhat finishProposal --dao {DAO_CONTRACT_ADDRESS} --proposal-id {PROPOSAL_ID} --network polygon-mumbai
```

Running a withdraw task:
```shell
npx hardhat withdraw --dao {DAO_CONTRACT_ADDRESS} --network polygon-mumbai
```
