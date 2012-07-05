(ns webrot.models.fractal
  (:require [webrot.models.lut :as lut])
  (:import [java.awt.image BufferedImage]))

(defrecord Bounds [top right bottom left])

(defn to-bounds [[top rgt bot lft]]
  (Bounds. 
    (max top bot)
    (max lft rgt)
    (min top bot)
    (min lft rgt)))

(defn julia-set
  ([c] (julia-set [1 1.5 -1 -1.5] c))
  ([bounds c]
    { :bounds (to-bounds bounds)
      :start-fn (fn [xy] xy)
      :c-fn (fn [xy] c) }))

(defn mandlebrot-set
  ([] (mandlebrot-set [1 0.5 -1 -2]))
  ([bounds]
    { :bounds (to-bounds bounds)
      :start-fn (fn [xy] [0 0])
      :c-fn (fn [xy] xy) }))

(defn- abs [n]
  (if (neg? n) (- n) n))

(defn- width [bounds]
  (abs (- (:left bounds) (:right bounds))))

(defn- height [bounds]
  (abs (- (:top bounds) (:bottom bounds))))

(defn zoom-in [bounds screen x y]
  "Recalculate bounds (zoom in by 50%)"
  (let [bot (+ (:bottom bounds) (* y (/ (height bounds) (height screen))) (/ (height bounds) -4))
        lft (+ (:left bounds)   (* x (/ (width bounds)  (width screen)))  (/ (width bounds) -4))]
    (Bounds.
      (double (+ bot (/ (height bounds) 2))) ; top
      (double (+ lft (/ (width bounds) 2)))  ; right
      (double bot)
      (double lft))))

(defn zoom-out [bounds screen x y]
  "Recalculate bounds (zoom out by 50%)"
  (let [bot (+ (:bottom bounds) (* y (/ (height bounds) (height screen))) (- (height bounds)))
        lft (+ (:left bounds)   (* x (/ (width bounds)  (width screen)))  (- (width bounds)))]
    (Bounds.
      (double (+ bot (* (height bounds) 2))) ; top
      (double (+ lft (* (width bounds) 2)))  ; right
      (double bot)
      (double lft))))

(defn real-coords [bounds screen x y]
  (let [bounds (to-bounds bounds)
        screen (to-bounds screen)]
  { :x (double (+ (:left bounds)   (* (width bounds)  (/ x (width screen)))))
    :y (double (+ (:bottom bounds) (* (height bounds) (/ y (height screen))))) }))

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
        xs (gen-offsets w (width bounds)  (:left bounds))
        ys (gen-offsets h (height bounds) (:bottom bounds))
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
        x-offsets (partial nth (gen-offsets w (width bounds) (:left bounds)))
        y-offsets (partial nth (gen-offsets h (height bounds) (:bottom bounds)))
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

