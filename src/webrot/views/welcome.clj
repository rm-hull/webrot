(ns webrot.views.welcome
  (:require [webrot.views.common :as common]
            [webrot.models.lut :as lut])
  (:use [noir.core :only [defpage custom-handler]]
        [hiccup.core :only [html]]
        [webrot.models.fractal :only [fractal mandlebrot-set julia-set]]
        [clojure.string :only [split]])
  (:import [java.awt.image BufferedImage]))

(defpage "/welcome" []
  (common/layout
    [:h1 "Welcome to webrot!"]
    [:p "You are visitor zero."]))

(defpage "/test/:lut" {:keys [lut]}
  (let [w 800
        h 600
        img (BufferedImage. w h BufferedImage/TYPE_INT_RGB)
        colors (lut/from-name lut)]
    (doseq [x (range w)
            y (range h)]
      (.setRGB img x y (lut/get-color colors y)))
    img))

(defn parse-arg
  ([bounds] (parse-arg bounds nil))
  ([bounds defaults]
    (if (seq bounds)
      (map read-string (split bounds #","))
      defaults)))

(defpage "/mandlebrot/:lut" {:keys [lut bounds size cut-off]}
  (let [color-map (partial lut/get-color (lut/from-name lut))]
    (fractal
      (parse-arg size [800 600])
      (mandlebrot-set (parse-arg bounds [1 0.5 -1 -2]))
      (first (parse-arg cut-off [50]))
      color-map)))

(defpage "/julia/:lut" {:keys [lut bounds size cut-off]}
  (let [color-map (partial lut/get-color (lut/from-name lut))]
    (fractal
      (parse-arg size [800 600])
      (julia-set [-1.2311 -0.54320] (parse-arg bounds [1 1.5 -1 -1.5]))
      (first (parse-arg cut-off [50]))
      color-map)))
