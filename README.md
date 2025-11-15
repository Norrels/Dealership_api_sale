# API de Gerenciamento de Vendas de Veículos

API RESTful para gerenciamento de vendas de veículos construída com princípios de Clean Architecture, implementando padrões abrangentes de arquitetura hexagonal e design orientado a domínio.

## Visão Geral da Arquitetura

Este projeto segue os princípios da Clean Architecture com clara separação de responsabilidades em três camadas principais:

### Camada de Domínio

A camada mais interna contendo a lógica de negócio e regras empresariais.

- **Entidades**: Objetos de negócio fundamentais (`Sale`, `Vehicle`)
- **Value Objects**: Objetos imutáveis com validações (`CPF`)
- **Portas**: Interfaces definindo contratos para dependências externas (`SaleRepositoryPort`, `VehicleRepositoryPort`, `WebhookPort`)

### Camada de Aplicação

Orquestra o fluxo de dados e implementa os casos de uso.

- **Serviços**: Implementação da lógica de negócio (`SaleService`, `VehicleService`)
- **DTOs**: Objetos de transferência de dados para validação de requisições/respostas (`CreateSaleDTO`)

### Camada de Infraestrutura

Lida com preocupações externas e detalhes técnicos.

- **Banco de Dados**: Integração PostgreSQL via Drizzle ORM
- **Adaptadores**: Implementações concretas das portas de domínio
  - `SaleRepositoryAdapter`: Persistência de vendas
  - `VehicleRepositoryAdapter`: Cache e sincronização de veículos
  - `WebhookAdapter`: Notificações externas
- **Schemas**: Definições de tabelas do banco de dados

## Stack Tecnológica

- **Runtime**: Bun v1.2+
- **Framework**: Elysia (Framework web TypeScript de alta performance)
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validação**: Zod (TypeBox via Elysia)
- **Logging**: Pino
- **Testes**: Bun Test com cobertura de 94%+

## Estrutura do Projeto

```
src/
├── domain/
│   ├── models/            # Entidades e Value Objects
│   │   ├── cpf.ts         # Value Object para CPF
│   │   ├── sale.ts        # Entidade Sale
│   │   └── vehicle.ts     # Entidade Vehicle
│   └── ports/out/         # Interfaces de repositório
│       ├── saleRepositoryPort.ts
│       ├── vehicleRepositoryPort.ts
│       └── webhookPort.ts
│
├── application/
│   ├── service/           # Orquestração da lógica de negócio
│   │   ├── saleService.ts
│   │   └── vehicleService.ts
│   └── dto/               # Objetos de transferência de dados
│       └── saleDTO.ts
│
├── infrastructure/
│   ├── database/          # Conexão e schemas do banco
│   │   ├── index.ts
│   │   └── schemas/
│   │       └── sale.ts
│   └── adapters/          # Implementações de repositório
│       ├── saleRepositoryAdapter.ts
│       ├── vehicleRepositoryAdapter.ts
│       └── webhookAdapter.ts
│
├── config/                # Configuração da aplicação
│   ├── drizzle.ts
│   ├── env.ts
│   ├── logger.ts
│   └── openapi.ts
│
└── test/
    ├── helpers.ts         # Utilitários de teste
    └── setup.ts           # Configuração global
```

## Padrões de Design

### Arquitetura Hexagonal (Portas e Adaptadores)

- **Portas**: Definidas em `domain/ports` como interfaces
- **Adaptadores**: Implementados em `infrastructure/adapters` para sistemas externos

### Padrão Repository

Abstrai o acesso a dados através de interfaces, permitindo que a camada de domínio permaneça independente dos detalhes de persistência.

### Value Objects

Objetos imutáveis que encapsulam validações e regras de negócio específicas (exemplo: validação de CPF brasileiro).

### Injeção de Dependência

Os serviços recebem suas dependências através de injeção no construtor, permitindo baixo acoplamento e testabilidade.

## Endpoints da API

### Operações Principais

- `POST /api/v1/sales/` - Criar uma nova venda
- `GET /api/v1/sales/sold` - Listar todos os veículos vendidos
- `GET /api/v1/sales/available` - Listar veículos disponíveis para venda

### Monitoramento

- `GET /health` - Health check do serviço

### Documentação OpenAPI

Documentação interativa da API disponível nos endpoints:

- `GET /openapi` - Especificação OpenAPI

## Configuração de Ambiente

Variáveis de ambiente necessárias:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
VEHICLE_SERVICE_URL=http://localhost:3000/api/v1/vehicles
PORT=3001
LOG_LEVEL=info  # debug | info | warn | error | silent
```

## Scripts

```bash
# Desenvolvimento
bun run dev              # Iniciar servidor de desenvolvimento com hot reload

# Testes
bun test                 # Executar todos os testes
bun test:watch          # Executar testes em modo watch
bun test:coverage       # Gerar relatório de cobertura
bun test:ci             # Executar testes em ambiente CI/CD

# Banco de Dados
bun run db:push         # Aplicar mudanças de schema no banco
```

## Decisões Arquiteturais

### Cache de Veículos

O `VehicleRepositoryAdapter` implementa cache local em memória para otimizar consultas:

- Cache atualizado a cada requisição bem-sucedida à API externa
- Fallback para cache local em caso de falha na API (resilience)

**Trade-off**: Performance sobre escalabilidade (irei migrar para o redis).

### Estratégia de Testes

O projeto utiliza uma abordagem focada em testes de integração com implementações reais:

Minimiza o uso de mocks, priorizando testes que validam comportamento end-to-end.

## Garantia de Qualidade

### Qualidade do Código

- TypeScript em modo strict habilitado
- Segurança de tipos abrangente
- Formatação consistente de código
- Cobertura de testes: 86% de funções, 94.52% de linhas

### Logging

- Logging JSON estruturado via Pino
- Contexto relevante em cada log (IDs, status, metadata)
- Diferentes níveis de log por ambiente
- LOG_LEVEL=silent para execução de testes

### CI/CD

Pipeline automatizado via GitHub Actions:

1. PostgreSQL service container
2. Instalação de dependências
3. Sincronização do schema do banco
4. Execução de testes com coverage
5. Validação em branches main e development
