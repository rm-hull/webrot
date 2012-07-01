(ns webrot.client.main
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm])
  (:use [jayq.core :only [$ hide show bind attr fade-in]]
        [crate.util :only [url]]))

(def $fractal ($ :#fractal>img))
(def $spinner ($ :#spinner))

(def params (atom {}))


(defn- coords-from-event [e] 
  { :x (.-offsetX e)
    :y (.-offsetY e) })

(bind $fractal :load
  (fn []
    (hide $spinner)))

(bind $fractal :click 
  (fn [e] 
    (.preventDefault e)
    (show $spinner)
    (this-as me
      (let [$me ($ me)
            xy (coords-from-event e)
            merged-params (merge (deref params) xy)]
        (fm/remote (zoom-in merged-params) [result]
            (swap! params merge result)
           ; (fade-in $fractal 400) 
            (attr $fractal :src (url "mandlebrot" result))
;            (animate $fractal {:src (url "mandlebrot" result)})
;            (.log js/console (str "Click: " (url "mandlebrot" result))))))))
                   )))))
          
