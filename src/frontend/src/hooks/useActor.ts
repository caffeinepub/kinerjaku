import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Global actor cache for waitForActor
let _cachedActor: backendInterface | null = null;
let _actorResolvers: Array<(actor: backendInterface) => void> = [];

export function resolveActorCache(actor: backendInterface) {
  _cachedActor = actor;
  for (const resolve of _actorResolvers) {
    resolve(actor);
  }
  _actorResolvers = [];
}

export function clearActorCache() {
  _cachedActor = null;
  _actorResolvers = [];
}

export function waitForActor(): Promise<backendInterface> {
  if (_cachedActor) {
    return Promise.resolve(_cachedActor);
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Actor not ready: timeout after 15 seconds"));
    }, 15000);
    _actorResolvers.push((actor) => {
      clearTimeout(timeout);
      resolve(actor);
    });
  });
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
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
    staleTime: Number.POSITIVE_INFINITY,
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
