(ns webrot.models.lut
  (:require [webrot.models.spectrum :as spectrum])
  (:use     [clojure.string :only (split-lines split trim)])
  (:import  [java.io File FileFilter]))

(def maps-path "./resources/private/maps/")

(defn from-mapfile [fname]
  (letfn [(parse-num [s] (if (seq s) (Integer/parseInt s) 0))
          (parse-nums [coll] (map parse-num coll))
          (to-rgb [[red green blue]] { :r red :g green :b blue :s (/ 1 256) })]
    (->> (str maps-path fname)
         slurp
         split-lines
         (map #(split % #"\D"))
         (remove empty?)
         (map (comp spectrum/rgb to-rgb parse-nums))
         (vec))))

(defn spectrum [num-colors]
  (let [f1 420 ; Red = 420 THz
        f2 750 ; Indigo = 750 THz
        step (double (/ (- f2 f1) num-colors))]
    (->> (iterate (partial + step) f1)
         (map (comp spectrum/rgb spectrum/frequency-color))
         (take num-colors)
         vec)))

(defn rainbow [num-colors]
  (letfn [(color [idx]
            { :r 1
              :g (Math/sin (/ (* 3 idx) num-colors))
              :b (double (/ idx num-colors)) })]
    (->> (range num-colors)
         (map (comp spectrum/rgb color))
         vec)))

(def file-filter
  (proxy [FileFilter] []
    (accept [f]
      (boolean (re-find #".*\.map$" (.getName f))))))

(defn get-map-files [dir-name]
  (let [dir (File. dir-name)]
    (->> (.listFiles dir file-filter)
         (map #(.getName %))
         (sort-by #(.toLowerCase %)))))

(defn get-color [lut idx]
  (if (nil? idx)
    0
    (nth lut (mod idx (count lut)))))

(defn from-name [s]
  (cond
    (= s "spectrum") (spectrum 48)
    (= s "rainbow")  (rainbow 48)
    :else            (from-mapfile (str s ".map"))))

