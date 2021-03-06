(ns webrot.server
  (:require [noir.server :as server]
            [noir.fetch.remotes :as remotes]
;            [cemerick.drawbridge :as drawbridge]
;            [ring.middleware.params :as params]
;            [ring.middleware.keyword-params :as keyword-params]
;            [ring.middleware.nested-params :as nested-params]
;            [ring.middleware.session :as session]
;            [ring.middleware.basic-authentication :as basic]
            [ring.middleware.gzip :as deflate]))

(server/load-views "src/webrot/views/")

;(def drawbridge-handler
;  (-> (drawbridge/ring-handler)
;      (keyword-params/wrap-keyword-params)
;      (nested-params/wrap-nested-params)
;      (params/wrap-params)
;      (session/wrap-session)))

(defn authenticated? [name pass]
  (= [name pass] [(System/getenv "AUTH_USER") (System/getenv "AUTH_PASS")]))

;(defn wrap-drawbridge [handler]
;  (fn [req]
;    (let [handler (if (= "/repl" (:uri req))
;                    (basic/wrap-basic-authentication drawbridge-handler authenticated?)
;                    handler)]
;      (handler req))))

(defn -main [& m]
  (alter-var-root #'*read-eval* (constantly false))
  (let [mode (keyword (or (first m) :dev))
        port (read-string (get (System/getenv) "PORT" "8080"))]
    ;(server/add-middleware wrap-drawbridge)
    (server/add-middleware deflate/wrap-gzip)
    (server/start port {:mode mode
                        :ns 'webrot})))

