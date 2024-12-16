package logaml

import (
	"go.uber.org/zap"
)

var Log *zap.Logger

func init() {
	Log, _ = zap.NewDevelopment()
	// defer Log.Sync() // flushes buffer, if any
}
