(ns webrot.data-mappers.pascal
  (:import [java.awt.image BufferedImage]
           [java.awt Color]))

(def pascals-triangle
  (let [seed 1N]
    (letfn [(next-row [xs] (cons seed (map (partial apply +) (partition-all 2 1 xs))))
            (rows-seq [xs] (lazy-seq (cons xs (rows-seq (next-row xs)))))]
      (rows-seq (list seed)))))

(def integers (iterate inc 1))

(defn write-row [graphics [^long i data] ^long width mapper-fn]
  (let [y    (bit-shift-left i 1)
        offx (- width i)
        rng  (range offx (+ offx y) 2)]
    (doseq [[x cell] (map vector rng data)
            :when (pos? (mapper-fn cell))]
      (.fillRect graphics x y 2 2))))

(defn draw-gasket [^long num-rows divisor color]
  (let [img-sz (* 2 num-rows)
        img (BufferedImage. img-sz img-sz BufferedImage/TYPE_BYTE_BINARY)
        gfx (.createGraphics img)
        tri (take num-rows pascals-triangle)
        f   (fn [n] (mod n divisor))]
   (doto gfx
     (.setColor Color/WHITE)
     (.fillRect 0 0 img-sz img-sz)
     (.setColor Color/BLACK))
   (doseq [current-row (map vector integers tri)]
     (write-row gfx current-row num-rows f))
   img))
