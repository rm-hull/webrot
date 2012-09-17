(ns webrot.views.conway
  (:require [webrot.data-mappers.cellular-automata :as ca]
            [webrot.views.common :as common])
  (:use [noir.core :only [defpage defpartial]]
        [hiccup.page :only [include-css include-js html5]]
        [hiccup.util]))

(defpage "/conway" {:as params}
  (html5
    [:head
     [:title "Conway's Game of Life"]
     (include-css "/css/reset.css")
     (include-js "js/jquery.min.js")
     (include-js "js/requestAnim.js")]
    [:body
     [:canvas#conway {:width 800 :height 600}]
     (common/include-clojurescript "/cljs/conway.js")]))
