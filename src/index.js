console.log("Hello, GraphQL");

import { createSchema, createYoga, createPubSub } from "graphql-yoga";
import { createServer } from "node:http";

// ? base de dados
import { usuarios } from "./database/users";
import { ambientes } from "./database/environments";
import { participacoes } from "./database/holdings";
import { mensagens } from "./database/messages";

// schema -> objeto que agrupa as funcionalidades que existem no servidor, interfaces e resolvers

const pubSub = createPubSub();

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
            dataSaida: String   # a data de saida pode ser nula, indicando que o usuário está online naquele ambiente
        }
        type Query {
            hello: String!  # "!"" fala que é obrigacao devolver String, caso não tenha ! pode ser enviado outro tipo
            ambientes: [Ambiente!]!
            existe(nome: String!, senha: String!): Usuario   #(parametro: Tipo)
            usuariosOnline(ambiente: ID!):[Usuario!]!
            mensagensPorAmbiente(ambiente: ID!):[Mensagem!]!
        }
        type Mutation {     # metodos utilizados para fazer alteracoes insercoes e delecoes
            registrarEntrada(usuario: ID!, ambiente: ID!): Participacao!
            registrarSaida(usuario: ID!, ambiente: ID!): Participacao!
            registrarMensagem(texto: String, usuario: ID!, ambiente: ID!): Mensagem!
        }
        type Subscription {
            novaMensagem(ambiente: ID!): Mensagem!
            usuarioEntrou(ambiente: ID!): Usuario!
            usuarioSaiu(ambiente: ID!): Usuario!
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
            usuariosOnline: (parent, args, context, info) => {
                const idUsuarios = participacoes
                    .filter(
                        (p) =>
                            p.ambiente === args.ambiente && p.dataSaida === null
                    )
                    .map((p) => p.usuario);
                return usuarios.filter((u) => idUsuarios.includes(u.id));
            },
            mensagensPorAmbiente: (parent, args, context, info) => {
                return mensagens.filter((m) => m.ambiente === args.ambiente);
            },
        },
        Mutation: {
            registrarEntrada: (parent, args, context, info) => {
                const { pubSub } = context;
                const { usuario, ambiente } = args;
                const participacao = {
                    id: Math.random().toString(36).substring(2, 9),
                    usuario,
                    ambiente,
                    dataEntrada: new Date().toISOString(),
                    dataSaida: null,
                };
                participacoes.push(participacao);
                pubSub.publish(`A${ambiente}: Novo Usuário`, {
                    usuarioEntrou: usuarios.find((u) => u.id === usuario),
                });
                return participacao;
            },
            registrarSaida: (parent, args, context, info) => {
                const { pubSub } = context;
                const { usuario, ambiente } = args;
                const p = participacoes.find(
                    (p) =>
                        p.usuario === usuario &&
                        p.ambiente === ambiente &&
                        p.dataSaida === null
                ); // devolve uma variavel de referencia do objeto
                p.dataSaida = new Date().toISOString();
                pubSub.publish(`A${args.ambiente}: Usuario Saiu`, {
                    usuarioSaiu: usuarios.find((u) => u.id === usuario),
                });
                return p;
            },
            registrarMensagem: (parent, args, contenxt, info) => {
                const { pubSub } = contenxt;
                const { texto, usuario, ambiente } = args;
                const mensagem = {
                    id: Math.random().toString(36).substring(2, 9),
                    texto,
                    usuario,
                    ambiente,
                    data: new Date().toISOString(),
                };
                mensagens.push(mensagem);
                pubSub.publish(`A${args.ambiente}: Nova Mensagem`, {
                    novaMensagem: mensagem,
                });
                return mensagem;
            },
        },
        Subscription: {
            novaMensagem: {
                subscribe: (parent, args, context, info) => {
                    return context.pubSub.subscribe(
                        `A${args.ambiente}: Nova Mensagem`
                    );
                },
            },
            usuarioEntrou: {
                subscribe: (parent, args, context, info) => {
                    return context.pubSub.subscribe(
                        `A${args.ambiente}: Novo Usuário`
                    );
                },
            },
            usuarioSaiu: {
                subscribe: (parent, args, context, info) => {
                    return context.pubSub.subscribe(
                        `A${args.ambiente}: Usuario Saiu`
                    );
                },
            },
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
                const idAmbientesUnicos = [...new Set(idAmbientes)];
                return ambientes.filter((a) =>
                    idAmbientesUnicos.includes(a.id)
                );
            },
        },
    },
});

const yoga = createYoga({
    schema,
    context: {
        pubSub,
    },
});

const server = createServer(yoga);
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Servidor disponível em http://localhost:${PORT}`);
});
