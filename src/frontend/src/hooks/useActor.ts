import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Global actor cache for waitForActor
let _actorResolvers: Array<(actor: backendInterface) => void> = [];
let _actorInstance: backendInterface | null = null;

export function clearActorCache() {
  _actorInstance = null;
  _actorResolvers = [];
}

export function waitForActor(timeoutMs = 15000): Promise<backendInterface> {
  return new Promise((resolve, reject) => {
    if (_actorInstance) {
      resolve(_actorInstance);
      return;
    }
    const timer = setTimeout(() => {
      const idx = _actorResolvers.indexOf(resolve);
      if (idx >= 0) _actorResolvers.splice(idx, 1);
      reject(new Error("Actor initialization timeout"));
    }, timeoutMs);

    _actorResolvers.push((actor) => {
      clearTimeout(timer);
      resolve(actor);
    });
  });
}

function resolveActorCache(actor: backendInterface) {
  _actorInstance = actor;
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
        const actor = await createActorWithConfig();
        resolveActorCache(actor);
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
      resolveActorCache(actor);
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
