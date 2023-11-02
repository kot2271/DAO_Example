# DAO

## Задача:
    Реализовать смарт-контракт DAO по схеме

    ![Schema_DAO](https://github.com/DAO_Example/blob/main/schema/Schema%20DAO.png)

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

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (polygon-mumbai):
```shell
npx hardhat run scripts/deploy.ts --network polygon-mumbai
```
