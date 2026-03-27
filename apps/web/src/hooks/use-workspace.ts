import { useState, useEffect, useCallback } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'

const LIST_ORGANIZATIONS = gql`
  query ListOrganizations {
    listOrganizations {
      id
      name
      slug
    }
  }
`

const LIST_WORKFLOWS = gql`
  query ListWorkflows($orgId: String!) {
    listWorkflows(orgId: $orgId) {
      id
      name
      description
      currentVersion
      updatedAt
    }
  }
`

const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      slug
    }
  }
`

export interface OrgSummary {
  id: string
  name: string
  slug: string
}

export interface WorkflowSummary {
  id: string
  name: string
  description: string | null
  currentVersion: number
  updatedAt: string
}

const ACTIVE_ORG_KEY = 'ff_active_org_id'

export function useWorkspace() {
  const { data: orgsData, loading: orgsLoading } = useQuery<{ listOrganizations: OrgSummary[] }>(
    LIST_ORGANIZATIONS,
  )

  const orgs = orgsData?.listOrganizations ?? []

  // Restore last-used org from localStorage, fallback to first org
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACTIVE_ORG_KEY)
  })

  // When orgs load, default to first if nothing stored
  useEffect(() => {
    if (!activeOrgId && orgs.length > 0) {
      setActiveOrgIdState(orgs[0].id)
    }
  }, [orgs, activeOrgId])

  const setActiveOrgId = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_ORG_KEY, id)
    setActiveOrgIdState(id)
  }, [])

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0] ?? null

  const { data: workflowsData, loading: workflowsLoading } = useQuery<{
    listWorkflows: WorkflowSummary[]
  }>(LIST_WORKFLOWS, {
    variables: { orgId: activeOrgId },
    skip: !activeOrgId,
  })

  const workflows = workflowsData?.listWorkflows ?? []

  const [createOrgMutation] = useMutation(CREATE_ORGANIZATION, {
    refetchQueries: [{ query: LIST_ORGANIZATIONS }],
  })

  const createOrg = useCallback(
    async (name: string): Promise<OrgSummary | null> => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const { data } = await createOrgMutation({ variables: { input: { name, slug } } })
      const org = data?.createOrganization as OrgSummary | undefined
      if (org) setActiveOrgId(org.id)
      return org ?? null
    },
    [createOrgMutation, setActiveOrgId],
  )

  return {
    orgs,
    orgsLoading,
    activeOrg,
    activeOrgId,
    setActiveOrgId,
    workflows,
    workflowsLoading,
    createOrg,
  }
}
