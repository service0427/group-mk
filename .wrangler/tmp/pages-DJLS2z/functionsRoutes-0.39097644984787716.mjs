import { onRequest as __api_location_js_onRequest } from "/home/jun/group-mk/functions/api/location.js"
import { onRequest as __api_ping_js_onRequest } from "/home/jun/group-mk/functions/api/ping.js"
import { onRequest as __api_places_js_onRequest } from "/home/jun/group-mk/functions/api/places.js"
import { onRequest as __api_search_js_onRequest } from "/home/jun/group-mk/functions/api/search.js"
import { onRequest as ____path___js_onRequest } from "/home/jun/group-mk/functions/[[path]].js"
import { onRequest as ___middleware_js_onRequest } from "/home/jun/group-mk/functions/_middleware.js"

export const routes = [
    {
      routePath: "/api/location",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_location_js_onRequest],
    },
  {
      routePath: "/api/ping",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ping_js_onRequest],
    },
  {
      routePath: "/api/places",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_places_js_onRequest],
    },
  {
      routePath: "/api/search",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_search_js_onRequest],
    },
  {
      routePath: "/:path*",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [____path___js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]