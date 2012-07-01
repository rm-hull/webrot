(ns webrot.client.main
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm])
  (:use [jayq.core :only [$ hide show bind attr fade-in document-ready val]]
        [crate.util :only [url]]))

(def $fractal ($ :#fractal>a))
(def $img ($ :#fractal>a>img))
(def $spinner ($ :#spinner))

(def params (atom {}))
(def busy (atom true))

(defn- coords-from-event [e] 
  { :x (.-offsetX e)
    :y (.-offsetY e) })

(defn- form-params []
  { :lut     (val ($ "#control-ribbon #lut :selected"))
    :cut-off (val ($ "#control-ribbon #cut-off :selected")) })

(document-ready 
  (fn []

    (bind $img :load
      (fn []
        (swap! busy not)
        (hide $spinner)))

    (bind $fractal :click 
      (fn [e] 
        (.preventDefault e)
        (if (compare-and-set! busy false true)
          (this-as me
            (show $spinner)
            (let [$me ($ me)
                  merged-params (merge 
                                  (deref params) 
                                  (form-params) 
                                  (coords-from-event e))]
              (fm/remote (zoom-in merged-params) [result]
                (swap! params merge result)
                (swap! busy identity true)
                (attr $img :src (url "mandlebrot" result))
    ;            (fade-in $fractal 400) 
    ;            (animate $fractal {:src (url "mandlebrot" result)})
    ;            (.log js/console (str "Click: " (url "mandlebrot" result))))))))
                false))))))))
          
