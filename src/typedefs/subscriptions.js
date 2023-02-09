import gql from "graphql-tag";

export default gql`
    type Subscription {
        novaMensagem(ambiente: ID!): Mensagem!
        usuarioEntrou(ambiente: ID!): Usuario!
        usuarioSaiu(ambiente: ID!): Usuario!
    }
`;
