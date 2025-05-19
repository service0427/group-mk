"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // .wrangler/tmp/bundle-3qkaor/checked-fetch.js
  var urls = /* @__PURE__ */ new Set();
  function checkURL(request, init) {
    const url = request instanceof URL ? request : new URL(
      (typeof request === "string" ? new Request(request, init) : request).url
    );
    if (url.port && url.port !== "443" && url.protocol === "https:") {
      if (!urls.has(url.toString())) {
        urls.add(url.toString());
        console.warn(
          `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
        );
      }
    }
  }
  __name(checkURL, "checkURL");
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply(target, thisArg, argArray) {
      const [request, init] = argArray;
      checkURL(request, init);
      return Reflect.apply(target, thisArg, argArray);
    }
  });

  // node_modules/wrangler/templates/middleware/common.ts
  var __facade_middleware__ = [];
  function __facade_register__(...args) {
    __facade_middleware__.push(...args.flat());
  }
  __name(__facade_register__, "__facade_register__");
  function __facade_registerInternal__(...args) {
    __facade_middleware__.unshift(...args.flat());
  }
  __name(__facade_registerInternal__, "__facade_registerInternal__");
  function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
    const [head, ...tail] = middlewareChain;
    const middlewareCtx = {
      dispatch,
      next(newRequest, newEnv) {
        return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
      }
    };
    return head(request, env, ctx, middlewareCtx);
  }
  __name(__facade_invokeChain__, "__facade_invokeChain__");
  function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
    return __facade_invokeChain__(request, env, ctx, dispatch, [
      ...__facade_middleware__,
      finalMiddleware
    ]);
  }
  __name(__facade_invoke__, "__facade_invoke__");

  // node_modules/wrangler/templates/middleware/loader-sw.ts
  var __FACADE_EVENT_TARGET__;
  if (globalThis.MINIFLARE) {
    __FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
  } else {
    __FACADE_EVENT_TARGET__ = new EventTarget();
  }
  function __facade_isSpecialEvent__(type) {
    return type === "fetch" || type === "scheduled";
  }
  __name(__facade_isSpecialEvent__, "__facade_isSpecialEvent__");
  var __facade__originalAddEventListener__ = globalThis.addEventListener;
  var __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
  var __facade__originalDispatchEvent__ = globalThis.dispatchEvent;
  globalThis.addEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.addEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalAddEventListener__(type, listener, options);
    }
  };
  globalThis.removeEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.removeEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalRemoveEventListener__(type, listener, options);
    }
  };
  globalThis.dispatchEvent = function(event) {
    if (__facade_isSpecialEvent__(event.type)) {
      return __FACADE_EVENT_TARGET__.dispatchEvent(event);
    } else {
      return __facade__originalDispatchEvent__(event);
    }
  };
  globalThis.addMiddleware = __facade_register__;
  globalThis.addMiddlewareInternal = __facade_registerInternal__;
  var __facade_waitUntil__ = Symbol("__facade_waitUntil__");
  var __facade_response__ = Symbol("__facade_response__");
  var __facade_dispatched__ = Symbol("__facade_dispatched__");
  var __Facade_ExtendableEvent__ = class ___Facade_ExtendableEvent__ extends Event {
    static {
      __name(this, "__Facade_ExtendableEvent__");
    }
    [__facade_waitUntil__] = [];
    waitUntil(promise) {
      if (!(this instanceof ___Facade_ExtendableEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this[__facade_waitUntil__].push(promise);
    }
  };
  var __Facade_FetchEvent__ = class ___Facade_FetchEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_FetchEvent__");
    }
    #request;
    #passThroughOnException;
    [__facade_response__];
    [__facade_dispatched__] = false;
    constructor(type, init) {
      super(type);
      this.#request = init.request;
      this.#passThroughOnException = init.passThroughOnException;
    }
    get request() {
      return this.#request;
    }
    respondWith(response) {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      if (this[__facade_response__] !== void 0) {
        throw new DOMException(
          "FetchEvent.respondWith() has already been called; it can only be called once.",
          "InvalidStateError"
        );
      }
      if (this[__facade_dispatched__]) {
        throw new DOMException(
          "Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.",
          "InvalidStateError"
        );
      }
      this.stopImmediatePropagation();
      this[__facade_response__] = response;
    }
    passThroughOnException() {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#passThroughOnException();
    }
  };
  var __Facade_ScheduledEvent__ = class ___Facade_ScheduledEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_ScheduledEvent__");
    }
    #scheduledTime;
    #cron;
    #noRetry;
    constructor(type, init) {
      super(type);
      this.#scheduledTime = init.scheduledTime;
      this.#cron = init.cron;
      this.#noRetry = init.noRetry;
    }
    get scheduledTime() {
      return this.#scheduledTime;
    }
    get cron() {
      return this.#cron;
    }
    noRetry() {
      if (!(this instanceof ___Facade_ScheduledEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#noRetry();
    }
  };
  __facade__originalAddEventListener__("fetch", (event) => {
    const ctx = {
      waitUntil: event.waitUntil.bind(event),
      passThroughOnException: event.passThroughOnException.bind(event)
    };
    const __facade_sw_dispatch__ = /* @__PURE__ */ __name(function(type, init) {
      if (type === "scheduled") {
        const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
          scheduledTime: Date.now(),
          cron: init.cron ?? "",
          noRetry() {
          }
        });
        __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
        event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      }
    }, "__facade_sw_dispatch__");
    const __facade_sw_fetch__ = /* @__PURE__ */ __name(function(request, _env, ctx2) {
      const facadeEvent = new __Facade_FetchEvent__("fetch", {
        request,
        passThroughOnException: ctx2.passThroughOnException
      });
      __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
      facadeEvent[__facade_dispatched__] = true;
      event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      const response = facadeEvent[__facade_response__];
      if (response === void 0) {
        throw new Error("No response!");
      }
      return response;
    }, "__facade_sw_fetch__");
    event.respondWith(
      __facade_invoke__(
        event.request,
        globalThis,
        ctx,
        __facade_sw_dispatch__,
        __facade_sw_fetch__
      )
    );
  });
  __facade__originalAddEventListener__("scheduled", (event) => {
    const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
      noRetry: event.noRetry.bind(event)
    });
    __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
    event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
  });

  // node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
  var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } finally {
      try {
        if (request.body !== null && !request.bodyUsed) {
          const reader = request.body.getReader();
          while (!(await reader.read()).done) {
          }
        }
      } catch (e) {
        console.error("Failed to drain the unused request body.", e);
      }
    }
  }, "drainBody");
  var middleware_ensure_req_body_drained_default = drainBody;

  // node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
  function reduceError(e) {
    return {
      name: e?.name,
      message: e?.message ?? String(e),
      stack: e?.stack,
      cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
    };
  }
  __name(reduceError, "reduceError");
  var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" }
      });
    }
  }, "jsonError");
  var middleware_miniflare3_json_error_default = jsonError;

  // .wrangler/tmp/bundle-3qkaor/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_ensure_req_body_drained_default, middleware_miniflare3_json_error_default]);

  // map-api-worker.js
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
  });
  var MOCK_DATA = {
    query: "\uB9DB\uC9D1",
    adMids: ["11111", "22222", "33333"],
    normalList: [
      {
        type: "\uB9DB\uC9D1(Restaurant)",
        name: "\uD14C\uC2A4\uD2B8 \uB808\uC2A4\uD1A0\uB791 1",
        id: "12345",
        visit: 150,
        blog: 50,
        imageCount: 25,
        booking: "O",
        npay: "O",
        distance: "1.2km",
        category: "\uD55C\uC2DD",
        businessCategory: "\uC74C\uC2DD\uC810",
        categoryCodeList: "restaurant,korean",
        rank: 1,
        isAdDup: false
      },
      {
        type: "\uB9DB\uC9D1(Restaurant)",
        name: "\uD14C\uC2A4\uD2B8 \uB808\uC2A4\uD1A0\uB791 2",
        id: "23456",
        visit: 120,
        blog: 40,
        imageCount: 18,
        booking: "-",
        npay: "O",
        distance: "1.5km",
        category: "\uC591\uC2DD",
        businessCategory: "\uC74C\uC2DD\uC810",
        categoryCodeList: "restaurant,western",
        rank: 2,
        isAdDup: false
      },
      {
        type: "\uCE74\uD398(Cafe)",
        name: "\uD14C\uC2A4\uD2B8 \uCE74\uD398",
        id: "34567",
        visit: 80,
        blog: 30,
        imageCount: 15,
        booking: "-",
        npay: "-",
        distance: "0.8km",
        category: "\uCE74\uD398,\uB514\uC800\uD2B8",
        businessCategory: "\uCE74\uD398",
        categoryCodeList: "cafe,dessert",
        rank: 3,
        isAdDup: true
      }
    ]
  };
  var isDevEnvironment = true;
  async function handleRequest(request) {
    const url = new URL(request.url);
    console.log(`[Worker] Received request for ${url.pathname}`);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    try {
      if (url.pathname === "/api/ping") {
        console.log("[Worker] Handling ping request from: " + request.headers.get("origin") || "unknown");
        console.log("[Worker] Request URL: " + url.toString());
        console.log("[Worker] Worker Mode: " + (isDevEnvironment ? "Mock Data" : "Real API"));
        const responseData = {
          status: "ok",
          environment: isDevEnvironment ? "development" : "production",
          mockData: isDevEnvironment,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          worker_url: url.toString(),
          request_headers: Object.fromEntries([...request.headers])
        };
        console.log("[Worker] Sending ping response:", JSON.stringify(responseData));
        return new Response(JSON.stringify(responseData), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      if (url.pathname.startsWith("/api/")) {
        console.log(`[Worker] Processing API request: ${url.pathname}`);
        if (isDevEnvironment) {
          if (url.pathname === "/api/search") {
            console.log("[Worker] Returning mock data for search request");
            const query = url.searchParams.get("query") || "\uD14C\uC2A4\uD2B8";
            const mockData = JSON.parse(JSON.stringify(MOCK_DATA));
            mockData.query = query;
            mockData.normalList = mockData.normalList.map((item) => ({
              ...item,
              name: `${item.name} (${query})`
            }));
            return new Response(JSON.stringify(mockData), {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            });
          } else if (url.pathname === "/api/location") {
            console.log("[Worker] Returning mock location data");
            return new Response(JSON.stringify({
              result: {
                point: {
                  x: "126.671329",
                  y: "37.639775"
                }
              }
            }), {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            });
          } else if (url.pathname === "/api/places") {
            console.log("[Worker] Returning mock places data");
            return new Response(JSON.stringify(MOCK_DATA), {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            });
          }
        } else {
          try {
            if (url.pathname === "/api/search") {
              return await handleSearchRequest(request, url, corsHeaders);
            } else if (url.pathname === "/api/location") {
              return await handleLocationRequest(request, url, corsHeaders);
            } else if (url.pathname === "/api/places") {
              return await handlePlacesRequest(request, url, corsHeaders);
            }
          } catch (apiError) {
            console.error(`[Worker] API call failed: ${apiError.message}`);
            console.error(apiError.stack);
            console.log("[Worker] Falling back to mock data due to API error");
            if (url.pathname === "/api/search") {
              const query = url.searchParams.get("query") || "\uD14C\uC2A4\uD2B8";
              const mockData = JSON.parse(JSON.stringify(MOCK_DATA));
              mockData.query = query;
              mockData.normalList = mockData.normalList.map((item) => ({
                ...item,
                name: `${item.name} (${query}) - \uBAA8\uC758 \uB370\uC774\uD130`
              }));
              return new Response(JSON.stringify(mockData), {
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders
                }
              });
            } else if (url.pathname === "/api/location") {
              return new Response(JSON.stringify({
                result: {
                  point: {
                    x: "126.671329",
                    y: "37.639775"
                  }
                }
              }), {
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders
                }
              });
            } else if (url.pathname === "/api/places") {
              return new Response(JSON.stringify(MOCK_DATA), {
                headers: {
                  "Content-Type": "application/json",
                  ...corsHeaders
                }
              });
            }
          }
        }
        console.log(`[Worker] Unsupported API path: ${url.pathname}`);
        return new Response(JSON.stringify({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 API \uACBD\uB85C\uC785\uB2C8\uB2E4." }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      console.log(`[Worker] Not an API path: ${url.pathname}`);
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error(`[Worker] Unhandled error: ${error.message}`);
      console.error(error.stack);
      return new Response(JSON.stringify({
        error: "\uC11C\uBC84 \uB0B4\uBD80 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
        details: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  __name(handleRequest, "handleRequest");
  async function handleLocationRequest(request, url, corsHeaders) {
    const query = url.searchParams.get("query");
    if (!query) {
      return new Response(JSON.stringify({ error: "\uAC80\uC0C9\uC5B4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    try {
      const encodedQuery = encodeURIComponent(query);
      console.log(`[Worker] Fetching location for query: ${query}`);
      const response = await fetch("https://map.naver.com/p/api/location", {
        headers: {
          "accept": "application/json, text/plain, */*",
          "accept-language": "ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
        }
      });
      if (!response.ok) {
        throw new Error(`Location API returned status ${response.status}`);
      }
      const responseData = await response.json();
      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error(`[Worker] Location API error: ${error.message}`);
      throw error;
    }
  }
  __name(handleLocationRequest, "handleLocationRequest");
  async function handlePlacesRequest(request, url, corsHeaders) {
    const query = url.searchParams.get("query");
    const longitude = url.searchParams.get("x") || "126.671329";
    const latitude = url.searchParams.get("y") || "37.639775";
    if (!query) {
      return new Response(JSON.stringify({ error: "\uAC80\uC0C9\uC5B4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    try {
      const encodedQuery = encodeURIComponent(query);
      console.log(`[Worker] Fetching places for query: ${query}, coordinates: ${longitude},${latitude}`);
      const display = 70;
      const timestamp = Date.now();
      const placesUrl = `https://pcmap.place.naver.com/place/list?query=${encodedQuery}&x=${longitude}&y=${latitude}&clientX=${longitude}&clientY=${latitude}&display=${display}&ts=${timestamp}&additionalHeight=76&locale=ko&mapUrl=https%3A%2F%2Fmap.naver.com%2Fp%2Fsearch%2F${encodedQuery}`;
      const response = await fetch(placesUrl, {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "ko-KR,ko;q=0.9",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
        }
      });
      if (!response.ok) {
        throw new Error(`Places API returned status ${response.status}`);
      }
      const html = await response.text();
      const apolloStateMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/);
      if (!apolloStateMatch || !apolloStateMatch[1]) {
        console.error("[Worker] APOLLO_STATE data not found");
        throw new Error("APOLLO_STATE \uB370\uC774\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      let apolloStateData;
      try {
        apolloStateData = JSON.parse(apolloStateMatch[1]);
      } catch (parseError) {
        console.error(`[Worker] APOLLO_STATE parsing error: ${parseError.message}`);
        throw new Error("APOLLO_STATE \uB370\uC774\uD130 \uD30C\uC2F1 \uC624\uB958");
      }
      let placeInfoList = [];
      Object.entries(apolloStateData).forEach(([key, value]) => {
        if (value && typeof value.__typename === "string" && (value.__typename.endsWith("Summary") || value.__typename.endsWith("AdSummary"))) {
          let rawType = value.__typename;
          rawType = rawType.replace("ListSummary", "").replace("Summary", "").replace("Ad", "Ad");
          const typeMap = {
            Place: "\uB5A1\uC9D1(Place)",
            Restaurant: "\uB9DB\uC9D1(Restaurant)",
            Hospital: "\uBCD1\uC6D0(Hospital)",
            Beauty: "\uBBF8\uC6A9(Beauty)",
            Attraction: "\uAD00\uAD11(Attraction)",
            RestaurantAd: "\uB9DB\uC9D1\uAD11\uACE0(RestaurantAd)",
            HospitalAd: "\uBCD1\uC6D0\uAD11\uACE0(HospitalAd)",
            BeautyAd: "\uBBF8\uC6A9\uAD11\uACE0(BeautyAd)",
            AttractionAd: "\uAD00\uAD11\uAD11\uACE0(AttractionAd)"
          };
          const type = typeMap[rawType] || rawType;
          const name = value.name || "\uC774\uB984 \uC5C6\uC74C";
          const id = value.id || "-";
          const visit = value.visitorReviewCount || 0;
          const blog = value.blogCafeReviewCount || 0;
          const imageCount = value.imageCount || 0;
          const booking = value.hasBooking ? "O" : "-";
          const npay = value.hasNPay ? "O" : "-";
          const distance = value.distance || "N/A";
          const category = value.category || "-";
          const businessCategory = value.businessCategory || "-";
          const categoryCodeList = Array.isArray(value.categoryCodeList) ? value.categoryCodeList.join(",") : "-";
          placeInfoList.push({
            type,
            name,
            id,
            visit,
            blog,
            imageCount,
            booking,
            npay,
            distance,
            category,
            businessCategory,
            categoryCodeList
          });
        }
      });
      const isAd = /* @__PURE__ */ __name((type) => type.endsWith("Ad") || type.includes("\uAD11\uACE0"), "isAd");
      const adList = placeInfoList.filter((p) => isAd(p.type));
      const adMids = adList.map((p) => p.id);
      const normalList = placeInfoList.filter((p) => !isAd(p.type));
      const normalListWithDup = normalList.map((place, idx) => ({
        ...place,
        rank: idx + 1,
        isAdDup: adMids.includes(place.id)
      }));
      return new Response(JSON.stringify({
        query,
        adMids,
        normalList: normalListWithDup
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error(`[Worker] Places API error: ${error.message}`);
      throw error;
    }
  }
  __name(handlePlacesRequest, "handlePlacesRequest");
  async function handleSearchRequest(request, url, corsHeaders) {
    const searchQuery = url.searchParams.get("query");
    console.log(`[Worker] Processing search request for query: ${searchQuery}`);
    if (!searchQuery) {
      return new Response(JSON.stringify({ error: "\uAC80\uC0C9\uC5B4(query) \uD30C\uB77C\uBBF8\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      console.log(`[Worker] Fetching coordinates for: ${searchQuery}`);
      const locResponse = await fetch("https://map.naver.com/p/api/location", {
        headers: {
          "accept": "application/json, text/plain, */*",
          "accept-language": "ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
        }
      });
      if (!locResponse.ok) {
        throw new Error(`Location API returned status ${locResponse.status}`);
      }
      const locData = await locResponse.json();
      console.log(`[Worker] Location API response received`);
      let longitude, latitude;
      if (locData && locData.result && locData.result.point) {
        longitude = locData.result.point.x || locData.result.point.longitude;
        latitude = locData.result.point.y || locData.result.point.latitude;
      } else if (locData && locData.coord) {
        longitude = locData.coord.x || locData.coord.longitude;
        latitude = locData.coord.y || locData.coord.latitude;
      } else {
        longitude = "126.671329";
        latitude = "37.639775";
      }
      console.log(`[Worker] Using coordinates: ${longitude}, ${latitude}`);
      const display = 70;
      const timestamp = Date.now();
      const placesUrl = `https://pcmap.place.naver.com/place/list?query=${encodedQuery}&x=${longitude}&y=${latitude}&clientX=${longitude}&clientY=${latitude}&display=${display}&ts=${timestamp}&additionalHeight=76&locale=ko&mapUrl=https%3A%2F%2Fmap.naver.com%2Fp%2Fsearch%2F${encodedQuery}`;
      console.log(`[Worker] Fetching HTML content from Naver Places`);
      const htmlResponse = await fetch(placesUrl, {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "ko-KR,ko;q=0.9",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
        }
      });
      if (!htmlResponse.ok) {
        throw new Error(`HTML request returned status ${htmlResponse.status}`);
      }
      const html = await htmlResponse.text();
      console.log(`[Worker] HTML content received, length: ${html.length}`);
      const apolloStateMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/);
      if (!apolloStateMatch || !apolloStateMatch[1]) {
        console.error("[Worker] APOLLO_STATE not found in HTML");
        throw new Error("window.__APOLLO_STATE__ \uB370\uC774\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      let apolloStateData;
      try {
        console.log(`[Worker] Parsing APOLLO_STATE data`);
        apolloStateData = JSON.parse(apolloStateMatch[1]);
      } catch (parseError) {
        console.error(`[Worker] Failed to parse APOLLO_STATE: ${parseError.message}`);
        throw new Error("APOLLO_STATE \uB370\uC774\uD130 \uD30C\uC2F1 \uC624\uB958");
      }
      console.log(`[Worker] Processing place data`);
      let placeInfoList = [];
      Object.entries(apolloStateData).forEach(([key, value]) => {
        if (value && typeof value.__typename === "string" && (value.__typename.endsWith("Summary") || value.__typename.endsWith("AdSummary"))) {
          let rawType = value.__typename;
          rawType = rawType.replace("ListSummary", "").replace("Summary", "").replace("Ad", "Ad");
          const typeMap = {
            Place: "\uB5A1\uC9D1(Place)",
            Restaurant: "\uB9DB\uC9D1(Restaurant)",
            Hospital: "\uBCD1\uC6D0(Hospital)",
            Beauty: "\uBBF8\uC6A9(Beauty)",
            Attraction: "\uAD00\uAD11(Attraction)",
            RestaurantAd: "\uB9DB\uC9D1\uAD11\uACE0(RestaurantAd)",
            HospitalAd: "\uBCD1\uC6D0\uAD11\uACE0(HospitalAd)",
            BeautyAd: "\uBBF8\uC6A9\uAD11\uACE0(BeautyAd)",
            AttractionAd: "\uAD00\uAD11\uAD11\uACE0(AttractionAd)"
          };
          const type = typeMap[rawType] || rawType;
          const name = value.name || "\uC774\uB984 \uC5C6\uC74C";
          const id = value.id || "-";
          const visit = value.visitorReviewCount || 0;
          const blog = value.blogCafeReviewCount || 0;
          const imageCount = value.imageCount || 0;
          const booking = value.hasBooking ? "O" : "-";
          const npay = value.hasNPay ? "O" : "-";
          const distance = value.distance || "N/A";
          const category = value.category || "-";
          const businessCategory = value.businessCategory || "-";
          const categoryCodeList = Array.isArray(value.categoryCodeList) ? value.categoryCodeList.join(",") : "-";
          placeInfoList.push({
            type,
            name,
            id,
            visit,
            blog,
            imageCount,
            booking,
            npay,
            distance,
            category,
            businessCategory,
            categoryCodeList
          });
        }
      });
      const isAd = /* @__PURE__ */ __name((type) => type.endsWith("Ad") || type.includes("\uAD11\uACE0"), "isAd");
      const adList = placeInfoList.filter((p) => isAd(p.type));
      const adMids = adList.map((p) => p.id);
      const normalList = placeInfoList.filter((p) => !isAd(p.type));
      const normalListWithDup = normalList.map((place, idx) => ({
        ...place,
        rank: idx + 1,
        isAdDup: adMids.includes(place.id)
      }));
      console.log(`[Worker] Found ${normalListWithDup.length} places`);
      return new Response(JSON.stringify({
        query: searchQuery,
        adMids,
        normalList: normalListWithDup
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (err) {
      console.error(`[Worker] Search error: ${err.message}`);
      console.error(err.stack);
      throw err;
    }
  }
  __name(handleSearchRequest, "handleSearchRequest");
})();
//# sourceMappingURL=map-api-worker.js.map
