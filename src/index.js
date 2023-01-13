console.log("Hello, GraphQL");

import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from "node:http";

// ? base de dados
import { usuarios } from "./database/users";
import { ambientes } from "./database/environments";
import { participacoes } from "./database/participate";
import { mensagens } from "./database/messages";

// schema -> objeto que agrupa as funcionalidades que existem no servidor, interfaces e resolvers

const schema = createSchema({
    // define o que existe na interface(query, mutation, subcription)

    // "!"" fala que é obrigacao devolver String, caso não tenha ! pode ser enviado outro tipo
    typeDefs: `
        type Usuario {
            id: ID!     # proprio para identificadores, ! para ser obrigatorio
            nome: String!
            senha: String!
            mensagens: [Mensagem!]!     # não importa a ordem da definição dos tipos, ! dentro do [] fala que todos os objetos da lista são do tipo mensagem e o de fora fala que nunca vai ser passado uma lista com valor null: [null]
            ambientes:   [Ambiente!]!
        }
        type Mensagem{
            id: ID!
            texto: String!
            usuario: Usuario!   # cada mensagem pode ter o objeto usuario inteiro
            ambiente: Ambiente!
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
            dataSaida: String   # a data de saida pode ser nula, indicando que o usuário está online naquele ambiente
        }
        type Query {
            hello: String!  # "!"" fala que é obrigacao devolver String, caso não tenha ! pode ser enviado outro tipo
            ambientes: [Ambiente!]!
            existe(nome: String!, senha: String!): Usuario   #(parametro: Tipo)
            usuarios: [Usuario!]!
        }
    `,
    // define os resolvers para o que foi falado que existe na interface
    resolvers: {
        Query: {
            hello: () => "Hello, GraphQL",
            ambientes: () => ambientes,
            existe: (parent, args, context, info) => {
                // args da acessos as informacoes que o cliente envia
                const { nome, senha } = args;
                return usuarios.find(
                    (u) => u.nome === nome && u.senha === senha
                );
            },
            usuarios: () => usuarios,
        },
        Ambiente: {
            // Parent: referencia o ambiente da vez,

            // para os usuarios dentro do ambiente como que eu pego eles:
            usuarios: (parent, args, context, info) => {
                // parent objeto que o graphql passa na hora da busca
                const idUsuarios = participacoes
                    .filter((p) => p.ambiente === parent.id)
                    .map((p) => p.usuario);
                return usuarios.filter((u) => idUsuarios.includes(u.id));
            },
            mensagens: (parent, args, context, info) => {
                return mensagens.filter((m) => m.ambiente === parent.id);
            },
        },
        Usuario: {
            mensagens: (parent, args, context, info) => {
                return mensagens.filter((m) => m.usuario === parent.id);
            },
            ambientes: (parent, args, context, info) => {
                const idAmbientes = participacoes
                    .filter((p) => p.usuario === parent.id)
                    .map((pu) => pu.ambiente);
                const idAmbientesUnicos = [];
                idAmbientes.forEach((id) =>
                    idAmbientesUnicos.indexOf(id) < 0
                        ? idAmbientesUnicos.push(id)
                        : false
                );
                return ambientes.filter((a) =>
                    idAmbientesUnicos.includes(a.id)
                );
            },
        },
    },
});

const yoga = createYoga({
    schema,
});

const server = createServer(yoga);
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Servidor disponível em http://localhost:${PORT}`);
});
