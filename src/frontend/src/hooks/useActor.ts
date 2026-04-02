import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Shared promise to wait for the actor when it's being initialized
let actorReadyResolvers: Array<(actor: backendInterface) => void> = [];
let currentActor: backendInterface | null = null;

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        const actor = await createActorWithConfig();
        currentActor = actor;
        // Resolve any waiting callers
        for (const resolve of actorReadyResolvers) resolve(actor);
        actorReadyResolvers = [];
        return actor;
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      currentActor = actor;
      // Resolve any waiting callers
      for (const resolve of actorReadyResolvers) resolve(actor);
      actorReadyResolvers = [];
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}

/**
 * Returns a promise that resolves when the actor is ready.
 * If the actor is already available it resolves immediately.
 * Useful in mutation functions to avoid "actor not ready" errors.
 */
export function waitForActor(): Promise<backendInterface> {
  if (currentActor) {
    return Promise.resolve(currentActor);
  }
  return new Promise((resolve) => {
    actorReadyResolvers.push(resolve);
  });
}

// Reset currentActor when identity changes (logout scenario)
export function clearActorCache() {
  currentActor = null;
  actorReadyResolvers = [];
}
