# ADR-001: Monorepo Structure

## Status

**Accepted** - December 2024

## Context

EXOPTUS is a career navigation platform that will eventually consist of:

- Mobile app (React Native + Expo)
- Web dashboard (Next.js - future)
- Multiple backend services
- Shared libraries

We need to decide on a repository structure that supports:

- Trunk-based development
- Independent service deployment
- Code sharing between apps
- Clear ownership boundaries
- Future team scaling

## Decision

We will use a **FAANG-style monorepo** with npm workspaces, structured to **split later** if needed.

### Structure

```
exoptus/
├── apps/           # Frontend applications
├── services/       # Backend microservices
├── packages/       # Shared libraries
├── infra/          # Infrastructure
├── tools/          # Development tools
└── docs/           # Documentation
```

### Key Principles

1. **Workspace-based dependencies**: Use `workspace:*` for internal packages
2. **Independent versioning**: Each package has its own version
3. **Strict boundaries**: No cross-referencing between services
4. **Shared contracts**: API types in dedicated package

## Consequences

### Positive

- Single source of truth for all code
- Atomic commits across multiple packages
- Easier refactoring with IDE support
- Shared tooling (ESLint, TypeScript, Prettier)
- Simplified CI/CD with workspaces

### Negative

- Larger repository size over time
- Need for careful dependency management
- CI builds may take longer without caching
- Git history can become complex

### Mitigations

- Use Turborepo/Nx for build caching (future)
- Implement CODEOWNERS for ownership
- Regular cleanup of unused packages
- Documentation for contribution guidelines

## Alternatives Considered

### Polyrepo

- ❌ Harder to share code
- ❌ Dependency hell between repos
- ❌ Difficult atomic changes

### Lerna

- ❌ Additional tooling complexity
- ❌ npm workspaces now native
- ❌ Maintenance concerns

## References

- [Google Monorepo Paper](https://research.google/pubs/pub45424/)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
