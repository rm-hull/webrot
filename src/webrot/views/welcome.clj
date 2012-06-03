(ns webrot.views.welcome
  (:require [webrot.views.common :as common]
            [webrot.models.lut :as lut])
  (:use [noir.core :only [defpage custom-handler]]
 ;       [hiccup.core :only [html]]
        [webrot.models.fractal :only [fractal mandlebrot-set julia-set]])
  (:import [java.awt.image BufferedImage]))

;(defpage "/welcome" []
;         (common/layout
;[:h1 "Welcome to webrot!"]
;           [:p "You are visitor zero."]))

(defpage "/test/:lut" {:keys [lut]}
  (let [w 800
        h 600
        img (BufferedImage. w h BufferedImage/TYPE_INT_RGB)
        colors (lut/from-name lut)]
    (doseq [x (range w)
            y (range h)]
      (.setRGB img x y (lut/get-color colors y)))
    img))

(defpage "/mandlebrot/:lut" {:keys [lut]}
  (let [w 800
        h 600
        color-map (partial lut/get-color (lut/from-name lut))]
    (fractal [w h] (mandlebrot-set) 50 color-map)))

(defpage "/julia/:lut" {:keys [lut]}
  (let [w 800
        h 600
        color-map (partial lut/get-color (lut/from-name lut))]
    (fractal [w h] (julia-set [-1.0 0.0001]) 50 color-map)))


