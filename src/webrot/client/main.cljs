(ns webrot.client.main
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm])
  (:use [jayq.core :only [$ hide show bind attr fade-in document-ready val]]
        [crate.util :only [url]]))

(def $img      ($ :#fractal>a>img))
(def $fractal  ($ :#fractal>a))
(def $spinner  ($ :#spinner))
(def $refresh  ($ :#refresh))
(def $initial  ($ :#initial))
(def $zoom-in  ($ :#zoom-in))
(def $zoom-out ($ :#zoom-out))

(def params (atom {}))
(def busy (atom true))

(defn- coords-from-event [e] 
  { :x (.-offsetX e)
    :y (.-offsetY e) })

(defn- form-params []
  { :lut     (val ($ "#control-ribbon #lut :selected"))
    :cut-off (val ($ "#control-ribbon #cut-off :selected")) })

(defn- redraw [args]
  (if (compare-and-set! busy false true)
    (this-as me
      (show $spinner)
        (swap! params {} args)
        (swap! busy identity true)
        (attr $img :src (url "render" args))
        false)))
    ;            (fade-in $fractal 400) 
    ;            (animate $fractal {:src (url "mandlebrot" result)})
    ;            (.log js/console (str "Click: " (url "mandlebrot" result))))))))
  

(document-ready 
  (fn []

    (bind $img :load
      (fn []
        (swap! busy not)
        (hide $spinner)))

    (bind $fractal :click 
      (fn [e] 
        (.preventDefault e)
        (let [merged-params (merge 
                              (deref params) 
                              (form-params)
                              (coords-from-event e))]
          (fm/remote (zoom-in merged-params) [result]
            (redraw result)))))

    (bind $zoom-in :click 
      (fn [e] 
        (.preventDefault e)
        (let [merged-params (merge 
                              (deref params) 
                              (form-params)
                              {:x 400 :y 300})]
          (fm/remote (zoom-in merged-params) [result]
            (redraw result)))))

    (bind $zoom-out :click 
      (fn [e] 
        (.preventDefault e)
        (let [merged-params (merge 
                              (deref params) 
                              (form-params))]
          (fm/remote (zoom-out merged-params) [result]
            (redraw result)))))

    (bind $refresh :click
      (fn [e]
        (.preventDefault e)
        (redraw (merge 
                  (deref params) 
                  (form-params)))))
          
    (bind $initial :click
      (fn [e]
        (.preventDefault e)
        (redraw (form-params))))
    ))
          
