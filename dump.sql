--
-- PostgreSQL database dump
--

\restrict Xoi0opv3Wb3wko3m5XHEY3awmLeuHICzZgUdxjggqeMiU2s0COGHB0H2wj4tNBp

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categorias_foto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_foto (
    id integer NOT NULL,
    nome character varying(80) NOT NULL
);


--
-- Name: categorias_foto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_foto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_foto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_foto_id_seq OWNED BY public.categorias_foto.id;


--
-- Name: categorias_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_material (
    id integer NOT NULL,
    nome character varying(80) NOT NULL,
    icone character varying(10)
);


--
-- Name: categorias_material_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_material_id_seq OWNED BY public.categorias_material.id;


--
-- Name: fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fotos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    obra_id uuid,
    usuario_id uuid NOT NULL,
    categoria_id integer,
    descricao text,
    uri_local text,
    uri_remota text,
    status character varying(20) DEFAULT 'pendente'::character varying,
    avaliado_por uuid,
    avaliado_em timestamp without time zone,
    latitude numeric(10,7),
    longitude numeric(10,7),
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: materiais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materiais (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(150) NOT NULL,
    descricao text,
    unidade character varying(20) NOT NULL,
    categoria_id integer,
    estoque_atual numeric(10,3) DEFAULT 0,
    estoque_minimo numeric(10,3) DEFAULT 0,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: movimentacoes_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_estoque (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    material_id uuid NOT NULL,
    obra_id uuid,
    usuario_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    quantidade numeric(10,3) NOT NULL,
    quantidade_anterior numeric(10,3),
    motivo text,
    status character varying(20) DEFAULT 'pendente'::character varying,
    confirmado_por uuid,
    confirmado_em timestamp without time zone,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: obras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obras (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(150) NOT NULL,
    endereco text,
    responsavel_id uuid,
    status character varying(30) DEFAULT 'ativa'::character varying,
    iniciada_em date,
    prevista_em date,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: perfis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perfis (
    id integer NOT NULL,
    nome character varying(50) NOT NULL,
    descricao text,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: perfis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.perfis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: perfis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.perfis_id_seq OWNED BY public.perfis.id;


--
-- Name: registros_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_ponto (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    obra_id uuid,
    data date NOT NULL,
    entrada time without time zone,
    saida_almoco time without time zone,
    entrada_almoco time without time zone,
    saida time without time zone,
    total_horas numeric(4,2),
    observacao text,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    avatar character varying(10),
    perfil_id integer NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: categorias_foto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_foto ALTER COLUMN id SET DEFAULT nextval('public.categorias_foto_id_seq'::regclass);


--
-- Name: categorias_material id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_material ALTER COLUMN id SET DEFAULT nextval('public.categorias_material_id_seq'::regclass);


--
-- Name: perfis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfis ALTER COLUMN id SET DEFAULT nextval('public.perfis_id_seq'::regclass);


--
-- Data for Name: categorias_foto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_foto (id, nome) FROM stdin;
1	Estrutura
2	Acabamento
3	Problema / Não conformidade
4	Progresso
5	EPI / Segurança
6	Outros
\.


--
-- Data for Name: categorias_material; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_material (id, nome, icone) FROM stdin;
1	Cimento e Argamassa	🧱
2	Ferragens	🔩
3	Elétrica	⚡
4	Hidráulica	💧
5	Madeira	🪵
6	Tintas e Acabamento	🎨
7	EPI	🦺
8	Outros	📦
\.


--
-- Data for Name: fotos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fotos (id, obra_id, usuario_id, categoria_id, descricao, uri_local, uri_remota, status, avaliado_por, avaliado_em, latitude, longitude, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: materiais; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materiais (id, nome, descricao, unidade, categoria_id, estoque_atual, estoque_minimo, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: movimentacoes_estoque; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimentacoes_estoque (id, material_id, obra_id, usuario_id, tipo, quantidade, quantidade_anterior, motivo, status, confirmado_por, confirmado_em, criado_em) FROM stdin;
\.


--
-- Data for Name: obras; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.obras (id, nome, endereco, responsavel_id, status, iniciada_em, prevista_em, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: perfis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.perfis (id, nome, descricao, criado_em) FROM stdin;
1	admin	Administrador com acesso total	2026-03-27 14:03:48.009691
2	engenheiro	Engenheiro / Técnico	2026-03-27 14:03:48.009691
3	campo	Funcionário de Campo	2026-03-27 14:03:48.009691
4	almoxarife	Almoxarife / Estoquista	2026-03-27 14:03:48.009691
\.


--
-- Data for Name: registros_ponto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_ponto (id, usuario_id, obra_id, data, entrada, saida_almoco, entrada_almoco, saida, total_horas, observacao, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nome, email, senha_hash, avatar, perfil_id, ativo, criado_em, atualizado_em) FROM stdin;
01f85aca-d7c8-490b-82d1-bc3226c99e4c	Eduardo Henrique	eduardo.henrique.gomes@gmail.com	$2a$10$fX2vqM.lE0FY7u4thsitKueZWQhWFvjOH1cc8YzpEEWbcA.i6sTcW	EH	1	t	2026-03-27 14:54:42.143673	2026-03-28 20:14:08.617335
534d57fd-9628-4c8e-9319-e6866072266c	Admin	admin@sh.com	$2b$10$HjZLOBx8uScjpJigdtP.t.y/eHj4PuiQKSAZr540KDw8r.yE/EhSW	CA	1	t	2026-03-28 11:40:22.60784	2026-03-28 20:14:26.966964
\.


--
-- Name: categorias_foto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_foto_id_seq', 6, true);


--
-- Name: categorias_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_material_id_seq', 8, true);


--
-- Name: perfis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.perfis_id_seq', 4, true);


--
-- Name: categorias_foto categorias_foto_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_foto
    ADD CONSTRAINT categorias_foto_nome_key UNIQUE (nome);


--
-- Name: categorias_foto categorias_foto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_foto
    ADD CONSTRAINT categorias_foto_pkey PRIMARY KEY (id);


--
-- Name: categorias_material categorias_material_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_material
    ADD CONSTRAINT categorias_material_nome_key UNIQUE (nome);


--
-- Name: categorias_material categorias_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_material
    ADD CONSTRAINT categorias_material_pkey PRIMARY KEY (id);


--
-- Name: fotos fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_pkey PRIMARY KEY (id);


--
-- Name: materiais materiais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiais
    ADD CONSTRAINT materiais_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id);


--
-- Name: obras obras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_pkey PRIMARY KEY (id);


--
-- Name: perfis perfis_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfis
    ADD CONSTRAINT perfis_nome_key UNIQUE (nome);


--
-- Name: perfis perfis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfis
    ADD CONSTRAINT perfis_pkey PRIMARY KEY (id);


--
-- Name: registros_ponto registros_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_pkey PRIMARY KEY (id);


--
-- Name: registros_ponto registros_ponto_usuario_id_data_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_usuario_id_data_key UNIQUE (usuario_id, data);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_fotos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_categoria ON public.fotos USING btree (categoria_id);


--
-- Name: idx_fotos_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_criado ON public.fotos USING btree (criado_em);


--
-- Name: idx_fotos_obra; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_obra ON public.fotos USING btree (obra_id);


--
-- Name: idx_fotos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_status ON public.fotos USING btree (status);


--
-- Name: idx_fotos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_usuario ON public.fotos USING btree (usuario_id);


--
-- Name: idx_materiais_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materiais_categoria ON public.materiais USING btree (categoria_id);


--
-- Name: idx_materiais_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materiais_nome ON public.materiais USING btree (nome);


--
-- Name: idx_movest_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_criado ON public.movimentacoes_estoque USING btree (criado_em);


--
-- Name: idx_movest_material; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_material ON public.movimentacoes_estoque USING btree (material_id);


--
-- Name: idx_movest_obra; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_obra ON public.movimentacoes_estoque USING btree (obra_id);


--
-- Name: idx_movest_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_status ON public.movimentacoes_estoque USING btree (status);


--
-- Name: idx_movest_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_tipo ON public.movimentacoes_estoque USING btree (tipo);


--
-- Name: idx_movest_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_usuario ON public.movimentacoes_estoque USING btree (usuario_id);


--
-- Name: idx_obras_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obras_responsavel ON public.obras USING btree (responsavel_id);


--
-- Name: idx_obras_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obras_status ON public.obras USING btree (status);


--
-- Name: idx_ponto_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_data ON public.registros_ponto USING btree (data);


--
-- Name: idx_ponto_obra; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_obra ON public.registros_ponto USING btree (obra_id);


--
-- Name: idx_ponto_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_usuario ON public.registros_ponto USING btree (usuario_id);


--
-- Name: idx_ponto_usuario_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_usuario_data ON public.registros_ponto USING btree (usuario_id, data);


--
-- Name: idx_usuarios_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_ativo ON public.usuarios USING btree (ativo);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_perfil; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_perfil ON public.usuarios USING btree (perfil_id);


--
-- Name: fotos fotos_avaliado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_avaliado_por_fkey FOREIGN KEY (avaliado_por) REFERENCES public.usuarios(id);


--
-- Name: fotos fotos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_foto(id);


--
-- Name: fotos fotos_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id);


--
-- Name: fotos fotos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: materiais materiais_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiais
    ADD CONSTRAINT materiais_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_material(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_confirmado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_confirmado_por_fkey FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materiais(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: obras obras_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id);


--
-- Name: registros_ponto registros_ponto_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id);


--
-- Name: registros_ponto registros_ponto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: usuarios usuarios_perfil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES public.perfis(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Xoi0opv3Wb3wko3m5XHEY3awmLeuHICzZgUdxjggqeMiU2s0COGHB0H2wj4tNBp

