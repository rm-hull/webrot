(ns webrot.data-mappers.nks1)

(defn to-number 
  "Convert a collection of digits to a number"
  ([xs] (to-number xs 10))
  ([xs ^long radix]
    (let [index (cons 1 (reductions * (repeat radix)))]
      (reduce + (map * index (reverse xs))))))

(defn digits 
  ([^long n] (digits n 10))
  ([^long n ^long radix]
    (loop [n n
           res nil]
      (if (zero? n)
        res
        (recur 
          (quot n radix)
          (cons (rem n radix) res))))))

(defn neighbours [data]
  (partition 3 1 '(0) (cons 0 data)))

(defn rule-bits [n]
  (vec
    (take 8
      (concat 
        (reverse (digits n 2)) 
        (repeat 0)))))

(defn rule [^long n]
  (let [bits (rule-bits n)]
    (fn [x]
      (bits (to-number x 2)))))

(defn generations [rule-fn data]
  (lazy-seq 
    (cons 
      data 
        (generations
          rule-fn
          (map rule-fn (neighbours data))))))
 
(def start '(0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))

(defn display [coll]
  (apply str (map #(if (zero? %) " " ".") coll)))

(doseq [line (take 40 (generations (rule 133) start))]
  (prn (display line)))
