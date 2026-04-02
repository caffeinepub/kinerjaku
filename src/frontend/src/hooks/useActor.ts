import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Global actor cache for waitForActor
let _actorResolvers: Array<(actor: backendInterface) => void> = [];
let _cachedActor: backendInterface | null = null;

export function waitForActor(): Promise<backendInterface> {
  if (_cachedActor) {
    return Promise.resolve(_cachedActor);
  }
  return new Promise<backendInterface>((resolve, reject) => {
    const timeout = setTimeout(() => {
      _actorResolvers = _actorResolvers.filter((r) => r !== resolve);
      reject(new Error("Actor initialization timed out after 15 seconds"));
    }, 15000);

    const wrappedResolve = (actor: backendInterface) => {
      clearTimeout(timeout);
      resolve(actor);
    };

    _actorResolvers.push(wrappedResolve);
  });
}

export function clearActorCache(): void {
  _cachedActor = null;
  _actorResolvers = [];
}

function resolveActorCache(actor: backendInterface): void {
  _cachedActor = actor;
  const resolvers = _actorResolvers.splice(0);
  for (const resolve of resolvers) {
    resolve(actor);
  }
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries and resolve cache
  useEffect(() => {
    if (actorQuery.data) {
      resolveActorCache(actorQuery.data);
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
