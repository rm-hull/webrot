(ns webrot.views.welcome
  (:require [webrot.views.common :as common]
            [webrot.models.lut :as lut])
  (:use [noir.core :only [defpage custom-handler]]
        [hiccup.core :only [html]])
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
