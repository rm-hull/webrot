(ns webrot.models.fractal
  (:require [webrot.models.lut :as lut]))

(defrecord Complex [re im])

(defrecord Bounds [top right bottom left])

(def julia-set (Bounds. 1.0 1.5 -1.0 -1.5))

(def mandlebrot-set (Bounds. 1.0 1.0 -1.0 -2.0))

