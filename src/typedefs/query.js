import gql from "graphql-tag";

export default gql`
    type Query {
        hello: String! # "!"" fala que é obrigacao devolver String, caso não tenha ! pode ser enviado outro tipo
        ambientes: [Ambiente!]!
        existe(nome: String!, senha: String!): Usuario #(parametro: Tipo)
        usuariosOnline(ambiente: ID!): [Usuario!]!
        mensagensPorAmbiente(ambiente: ID!): [Mensagem!]!
    }
`;
