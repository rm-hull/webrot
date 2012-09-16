(ns webrot.data-mappers.bounds)

(defrecord Bounds [top right bottom left])

(defn to-bounds [[top rgt bot lft]]
  (Bounds. 
    (max top bot)
    (max lft rgt)
    (min top bot)
    (min lft rgt)))

(defn- abs [n]
  (if (neg? n) (- n) n))

(defn width [bounds]
  (abs (- (:left bounds) (:right bounds))))

(defn height [bounds]
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
