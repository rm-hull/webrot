(ns webrot.models.fractal
  (:require [webrot.models.lut :as lut])
  (:import [java.awt.image BufferedImage]))

(defrecord Bounds [top right bottom left])

(defn julia-set [c]
  { :bounds (Bounds. 1.0 1.5 -1.0 -1.5)
    :start-fn (fn [xy] xy)
    :c-fn (fn [xy] c) })

(defn mandlebrot-set []
  { :bounds (Bounds. 1.0 1.0 -1.0 -2.0)
    :start-fn (fn [xy] [0 0])
    :c-fn (fn [xy] xy) })

(defn- width [bounds]
  (Math/abs (- (:left bounds) (:right bounds))))

(defn- height [bounds]
  (Math/abs (- (:top bounds) (:bottom bounds))))

(defn zoom-in [bounds screen x y]
  "Recalculate bounds (zoom in by 50%)"
  (let [bot (+ (:bottom bounds) (* y (/ (height bounds) (height screen))) (/ (height bounds) -4))
        lft (+ (:left bounds) (* x (/ (width bounds) (width screen))) (/ (width bounds) -4))]
    (Bounds.
      (+ bot (/ (height bounds) 2)) ; top
      (+ lft (/ (width bounds) 2))  ; left
      bot
      lft)))

(defn- compute [[^double z-re ^double z-im] [^double c-re ^double c-im] ^long cut-off]
  (loop [counter 0
         z-re z-re
         z-im z-im]
    (let [pow2-re (* z-re z-re)
          pow2-im (* z-im z-im)]
      (cond
        (>= counter cut-off)      nil     ; Mandlebrot lake
        (> (+ pow2-re pow2-im) 4) counter ; |z| > 2, bail out
        :else (recur
                (inc counter)
                (+ (- pow2-re pow2-im) c-re)
                (+ (* 2 z-re z-im) c-im))))))

(defn- gen-offsets [img-n bounds-n bounds-start]
  (let [delta (/ bounds-n img-n)]
    (->> (range img-n)
         (map #(double (+ bounds-start (* % delta))))
         vec)))

(defn fractal [[w h] fractal-set cut-off color-map]
  (let [bounds (:bounds fractal-set)
        c-fn (:c-fn fractal-set)
        start-fn (:start-fn fractal-set)
        img (BufferedImage. w h BufferedImage/TYPE_INT_RGB)
        x-offsets (partial nth (gen-offsets w (width bounds) (:left bounds)))
        y-offsets (partial nth (gen-offsets h (height bounds) (:bottom bounds)))
        translate (fn [x y] [(x-offsets x) (y-offsets y)])]
    (doseq [y (range h)
            x (range w)
            :let [pt (translate x y)
                  z (start-fn pt)
                  c (c-fn pt)
                  result (compute z c cut-off)]]
      (.setRGB img x y (color-map result)))
    img))
