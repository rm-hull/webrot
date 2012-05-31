(ns webrot.core
  (:use noir.core)
  (:require [noir.server :as server]))

(server/start 8080)
