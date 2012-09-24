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
       (include-js "js/jquery.min.js")
       (include-js "js/requestAnim.js")]
      [:body
       [:canvas#world {:width 800 :height 600 
                       :data-color color 
                       :data-ca-type ca-type
                       :data-rand threshold}]
       (common/include-clojurescript "/cljs/conway.js")])))

(defn trim [[w h] [x y]] 
  (and 
    (>= x 0) 
    (>= y 0) 
    (< x w) 
    (< y h)))


(defremote ca-next-gen [size ca-type cells]
  (let [f (case ca-type
            "conway" ca/conways-game-of-life
            "semi-vote" ca/semi-vote
            "fredkin" ca/fredkin
            "vichniac-vote" ca/vichniac-vote
            "unstable-vichniac" ca/unstable-vichniac-vote
            )]
    (f cells (partial trim size))))
