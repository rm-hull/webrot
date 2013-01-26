(ns webrot.views.conway
  (:require [webrot.data-mappers.cellular-automata :as ca]
            [webrot.views.common :as common])
  (:use [noir.core :only [defpage defpartial]]
        [noir.fetch.remotes :only [defremote]]
        [hiccup.page :only [include-css include-js html5]]
        [hiccup.util]))

(defpage "/cellular-automata" {:as params}
  (let [color     (get params :color "yellow")
        ca-type   (get params :type "conway")
        threshold (get params :rand 0.5)]
    (html5
      [:head
       [:title "Cellular Automata"]
       (include-css "/css/reset.css")
       (include-js "https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js")]
      [:body
       [:canvas#world {:width 800 :height 600 
                       :data-color color 
                       :data-ca-type ca-type
                       :data-rand threshold}]
       (include-js "/cljs/conway.js")])))

(defn trim [[^long w ^long h] [^long x ^long y]] 
  (and 
    (>= x 0) 
    (>= y 0) 
    (< x w) 
    (< y h)))

(def dispatch-table
  { :conway ca/conways-game-of-life
    :semi-vote ca/semi-vote
    :fredkin ca/fredkin
    :circle ca/circle
    :vichniac-vote ca/vichniac-vote
    :unstable-vichniac ca/unstable-vichniac-vote })

(defn encode [cells]
  (-> cells vec flatten))

(defn decode [points]
  (->> points (partition 2) set))

(defremote ca-next-gen [size ca-type points]
  (let [disp-fn ((keyword ca-type) dispatch-table)
        trim-fn (fn [locn] (trim size locn))
        cells (decode points)]
    (encode (disp-fn cells trim-fn))))
