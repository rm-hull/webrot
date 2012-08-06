(ns webrot.data-mappers.fractal
  (:require [webrot.data-mappers.lut :as lut]
            [webrot.data-mappers.bounds :as b])
  (:import [java.awt.image BufferedImage]))

(defn julia-set
  ([c] (julia-set [1 1.5 -1 -1.5] c))
  ([bounds c]
    { :bounds (b/to-bounds bounds)
      :start-fn (fn [xy] xy)
      :c-fn (fn [xy] c) }))

(defn mandlebrot-set
  ([] (mandlebrot-set [1 0.5 -1 -2]))
  ([bounds]
    { :bounds (b/to-bounds bounds)
      :start-fn (fn [xy] [0 0])
      :c-fn (fn [xy] xy) }))

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
  (let [rng   (range img-n)
        delta (double (/ bounds-n img-n))]
    (->> rng
         (map #(+ bounds-start (* delta %)))
         (zipmap rng))))

(defn fractal [[w h] fractal-set cut-off color-map]
  (let [bounds (:bounds fractal-set)
        c-fn (:c-fn fractal-set)
        start-fn (:start-fn fractal-set)
        img (BufferedImage. w h BufferedImage/TYPE_INT_RGB)
        xs (gen-offsets w (b/width bounds)  (:left bounds))
        ys (gen-offsets h (b/height bounds) (:bottom bounds))
        ]
    (doseq [y ys
            x xs
            :let [pt [(val x) (val y)]
                  z (start-fn pt)
                  c (c-fn pt)
                  result (compute z c cut-off)]
            :when (not (nil? result))]
      (.setRGB img (key x) (key y) (color-map result)))
    img))

(defn process-row [translate-fn start-fn c-fn cut-off color-map xs y]
  (vec (for [x xs
          :let [pt (translate-fn x y)
                z (start-fn pt)
                c (c-fn pt)
                result (compute z c cut-off)]]
      (color-map result))))

(defn process-rows [translate-fn start-fn c-fn cut-off color-map xs ys]
  (let [processor (partial process-row translate-fn start-fn c-fn cut-off color-map xs)]
    (vec (map processor ys))))

(defn pfractal [[w h] fractal-set cut-off color-map]
  (let [bounds (:bounds fractal-set)
        c-fn (:c-fn fractal-set)
        start-fn (:start-fn fractal-set)
        img (BufferedImage. w h BufferedImage/TYPE_INT_RGB)
        x-offsets (partial nth (gen-offsets w (b/width bounds) (:left bounds)))
        y-offsets (partial nth (gen-offsets h (b/height bounds) (:bottom bounds)))
        translate-fn (fn [x y] [(x-offsets x) (y-offsets y)])
        xs (vec (range w))
        ys (vec (range h))
        processor (partial process-rows translate-fn start-fn c-fn cut-off color-map xs)
        chunks (partition-all (/ h 4) ys)
        data (reduce concat (pmap processor chunks))]
    (println (nth data 0))
    (doseq [y ys
            x xs
            :let [result (nth (nth data y) x)]]
      (.setRGB img x y result))
    img))

