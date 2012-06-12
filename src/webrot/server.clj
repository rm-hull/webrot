(ns webrot.server
  (:require [noir.server :as server]
            [cemerick.drawbridge :as drawbridge])
  (:use (ring.middleware params keyword-params nested-params session)
        (ring.middleware basic-authentication)))


(server/load-views "src/webrot/views/")

(def drawbridge-handler
  (-> (drawbridge/ring-handler)
      (ring.middleware.keyword-params/wrap-keyword-params)
      (ring.middleware.nested-params/wrap-nested-params)
      (ring.middleware.params/wrap-params)
      (ring.middleware.session/wrap-session)))

(defn authenticated? [name pass]
  (= [name pass] [(System/getenv "AUTH_USER") (System/getenv "AUTH_PASS")]))

(defn wrap-drawbridge [handler]
  (fn [req]
    (let [handler (if (= "/repl" (:uri req))
                    (ring.middleware.basic-authentication/wrap-basic-authentication
                      drawbridge-handler authenticated?)
                    handler)]
      (handler req))))

(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        port (Integer. (get (System/getenv) "PORT" "8080"))]
    (server/add-middleware wrap-drawbridge)
    (server/start port {:mode mode
                        :ns 'webrot})))

