(ns webrot.data-mappers.pascal
  (:import [java.awt.image BufferedImage]
           [java.awt Color]))

(def pascals-triangle
  (let [seed 1N]
    (letfn [(next-row [xs] (cons seed (map (partial apply +) (partition-all 2 1 xs))))
            (rows-seq [xs] (lazy-seq (cons xs (rows-seq (next-row xs)))))]
      (rows-seq (list seed)))))

(defn mapper [mapper-fn coll]
  (vec (map #(map mapper-fn %) coll)))

(defn write-row [graphics row data width]
  (let [y    (* 2 row)
        offx (- width (count data))
        data (vec data)]
    (doseq [i (range (count data))
            :let [x (+ offx (* 2 i))
                  color (nth data i)]]
      (doto graphics
        (.setColor color)
        (.fillRect x y 2 2)))))

(defn draw-gasket [num-rows divisor color]
  (let [img-sz (* 2 num-rows)
        img    (BufferedImage. img-sz img-sz BufferedImage/TYPE_INT_RGB)
        gfx    (.createGraphics img)
        tri    (take num-rows pascals-triangle)
        gasket (mapper #(if (zero? (mod % divisor)) Color/WHITE Color/BLACK) tri)]
   (doto gfx
     (.setColor Color/WHITE)
     (.fillRect 0 0 img-sz img-sz)) 
   (doseq [i (range num-rows)
           :let [row-data (nth gasket i)]]
     (write-row gfx i row-data num-rows))
   img))
