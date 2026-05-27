import { createAccessControl } from 'better-auth/plugins/access'

export const projectAc = createAccessControl({
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  team: ['create', 'update', 'delete'],
  ac: ['create', 'read', 'update', 'delete'],
  feedback: ['create', 'read', 'update', 'delete'],
  github: ['create', 'read', 'update', 'delete']
} as const)

export const projectRoles = {
  owner: projectAc.newRole({
    organization: ['update', 'delete'],
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    team: ['create', 'update', 'delete'],
    ac: ['create', 'read', 'update', 'delete'],
    feedback: ['create', 'read', 'update', 'delete'],
    github: ['create', 'read', 'update', 'delete']
  }),
  dev: projectAc.newRole({
    organization: [],
    member: [],
    invitation: [],
    team: [],
    ac: ['read'],
    feedback: ['create', 'read', 'update', 'delete'],
    github: ['create', 'read', 'update', 'delete']
  }),
  client: projectAc.newRole({
    organization: [],
    member: [],
    invitation: [],
    team: [],
    ac: ['read'],
    feedback: ['create', 'read', 'update'],
    github: []
  })
} as const

export type ProjectRole = keyof typeof projectRoles
