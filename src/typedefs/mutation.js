import gql from "graphql-tag";

export default gql`
    type Mutation { # metodos utilizados para fazer alteracoes insercoes e delecoes
        registrarEntrada(usuario: ID!, ambiente: ID!): Participacao!
        registrarSaida(usuario: ID!, ambiente: ID!): Participacao!
        registrarMensagem(texto: String, usuario: ID!, ambiente: ID!): Mensagem!
    }
`;
