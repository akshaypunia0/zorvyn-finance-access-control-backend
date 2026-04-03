import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zorvyn Finance Access Control API',
      version: '1.0.0',
      description:
        'RESTful API for managing financial records with role-based access control (RBAC). ' +
        'Roles: **ADMIN** (full access), **ANALYST** (read records/dashboard), **VIEWER** (dashboard only).',
    },
    servers: [
      {
        url: 'http://localhost:{port}',
        description: 'Local development server',
        variables: {
          port: { default: '4000' },
        },
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter the JWT token returned from `/api/auth/login` or `/api/auth/register`. ' +
            'The token is also set as an HTTP-only cookie named `token`.',
        },
      },
      schemas: {
        // ---------- Auth ----------
        RegisterRequest: {
          type: 'object',
          required: ['fullName', 'email', 'password'],
          properties: {
            fullName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+919876543210', nullable: true },
            password: { type: 'string', format: 'password', example: 'P@ssw0rd123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'P@ssw0rd123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                fullName: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', nullable: true },
                role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
                status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
              },
            },
            token: { type: 'string', description: 'JWT token (also set as HTTP-only cookie)' },
          },
        },

        // ---------- Financial Record ----------
        CreateRecordRequest: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', example: 5000 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
            category: { type: 'string', example: 'Salary' },
            date: { type: 'string', format: 'date', example: '2025-04-01' },
            notes: { type: 'string', nullable: true, example: 'Monthly salary' },
          },
        },
        UpdateRecordRequest: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 6000 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string', example: 'Freelance' },
            date: { type: 'string', format: 'date' },
            notes: { type: 'string', nullable: true },
          },
        },
        FinancialRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            createdBy: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                fullName: { type: 'string' },
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },

        // ---------- User ----------
        CreateUserRequest: {
          type: 'object',
          required: ['fullName', 'email', 'password'],
          properties: {
            fullName: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            phone: { type: 'string', nullable: true, example: '+919876543210' },
            password: { type: 'string', format: 'password', example: 'Str0ngP@ss' },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'], default: 'VIEWER' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
          },
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ---------- Dashboard ----------
        DashboardSummary: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                totals: {
                  type: 'object',
                  properties: {
                    totalIncome: { type: 'number' },
                    totalExpenses: { type: 'number' },
                    netBalance: { type: 'number' },
                    incomeTransactionCount: { type: 'integer' },
                    expenseTransactionCount: { type: 'integer' },
                  },
                },
                categoryBreakdown: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      income: { type: 'number' },
                      expense: { type: 'number' },
                      net: { type: 'number' },
                    },
                  },
                },
                recentActivity: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/FinancialRecord' },
                },
              },
            },
          },
        },

        // ---------- Shared ----------
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
