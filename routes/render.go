package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Render(c *gin.Context, data gin.H, templateName string) {
	loggedInInterface, e := c.Get("authenticated")
	if e {
		data["authenticated"] = loggedInInterface.(bool)
		if loggedInInterface.(bool) {
			log.Debug("User is authenticated")
		}
	}

	switch c.Request.Header.Get("Accept") {
	case "application/json":
		c.JSON(http.StatusOK, data["payload"]) // Respond with JSON
	case "application/xml":
		c.XML(http.StatusOK, data["payload"]) // Respond with XML
	default:
		c.HTML(http.StatusOK, templateName, data) // Respond with HTML
	}
}
