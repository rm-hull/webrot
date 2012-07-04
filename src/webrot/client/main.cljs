(ns webrot.client.main
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm])
  (:use [jayq.core :only [$ hide show bind attr fade-in document-ready val css anim]]
        [crate.util :only [url]]))

(def $img         ($ :#fractal>a>img))
(def $fractal     ($ :#fractal>a))
(def $spinner     ($ :#spinner))
(def $refresh     ($ :#refresh))
(def $initial     ($ :#initial))
(def $zoom-in     ($ :#zoom-in))
(def $zoom-out    ($ :#zoom-out))
(def $drag-target ($ :#drag-target))
(def $drop-zone   ($ :#drop-zone))

(def params (atom {}))
(def busy (atom true))

(defn- coords-from-event [event] 
  { :x (.-offsetX event)
    :y (.-offsetY event) })

(defn- coords-from-ui [ui] 
  { :x (-> ui .-offset .-left)
    :y (-> ui .-offset .-top) })

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

    (.draggable $drag-target)
    (.droppable $drop-zone)
   
    (bind $drop-zone :drop 
      (fn [event ui] 
        (let [merged-params (merge 
                       (deref params)
                       (form-params)
                       (coords-from-ui ui))]
          (fm/remote (real-coords merged-params) [result]
            (anim $drag-target { :left 0 :top 0 } 500)
            (redraw (merge 
                       (form-params)
                       { :start-posn (str (:x result) "," (:y result)) 
                         :bounds "1,1.5,-1,-1.5"
                         :type "julia" }))))))

    (bind $img :load
      (fn []
        (swap! busy not)
        (hide $spinner)))

    (bind $fractal :click 
      (fn [event] 
        (.preventDefault event)
        (let [merged-params (merge 
                              (deref params) 
                              (form-params)
                              (coords-from-event event))]
          (fm/remote (zoom-in merged-params) [result]
            (redraw result)))))

    (bind $zoom-in :click 
      (fn [event] 
        (.preventDefault event)
        (let [merged-params (merge 
                              (deref params) 
                              (form-params)
                              {:x 400 :y 300})]
          (fm/remote (zoom-in merged-params) [result]
            (redraw result)))))

    (bind $zoom-out :click 
      (fn [event] 
        (.preventDefault event)
        (let [merged-params (merge 
                              (deref params) 
                              (form-params))]
          (fm/remote (zoom-out merged-params) [result]
            (redraw result)))))

    (bind $refresh :click
      (fn [event]
        (.preventDefault event)
        (redraw (merge 
                  (deref params) 
                  (form-params)))))
          
    (bind $initial :click
      (fn [event]
        (.preventDefault event)
        (redraw (form-params))))
    ))
          
