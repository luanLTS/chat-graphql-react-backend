import gql from "graphql-tag";

export default gql`
    type Usuario {
        id: ID! # proprio para identificadores, ! para ser obrigatorio
        nome: String!
        senha: String!
        mensagens: [Mensagem!]! # não importa a ordem da definição dos tipos, ! dentro do [] fala que todos os objetos da lista são do tipo mensagem e o de fora fala que nunca vai ser passado uma lista com valor null: [null]
        ambientes: [Ambiente!]!
    }
    type Mensagem {
        id: ID!
        texto: String!
        usuario: Usuario! # cada mensagem pode ter o objeto usuario inteiro
        ambiente: Ambiente!
        data: String!
    }
    type Ambiente {
        id: ID!
        nome: String!
        usuarios: [Usuario!]!
        mensagens: [Mensagem!]!
    }
    type Participacao {
        id: ID!
        usuario: Usuario!
        ambiente: Ambiente!
        dataEntrada: String!
        dataSaida: String # a data de saida pode ser nula, indicando que o usuário está online naquele ambiente
    }
`;
