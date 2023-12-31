package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/alecthomas/kong"
	"github.com/meigma/omashu/cli/pkg"
	"github.com/meigma/omashu/cli/pkg/parsers"
	"github.com/meigma/omashu/cli/pkg/scanners"
	"github.com/spf13/afero"
)

var cli struct {
	Images imagesCmd `cmd:"" help:"Find the images generated by an Earthfile target."`
	Scan   scanCmd   `cmd:"" help:"Scan for Earthfiles."`
}

type imagesCmd struct {
	JSONOutput bool   `short:"j" long:"json" help:"Output in JSON format"`
	Path       string `                      help:"path to Earthfile"               arg:"" type:"path"`
	Target     string `short:"t"             help:"The target to search for images"                    required:"true"`
}

func (c *imagesCmd) Run() error {
	parser := parsers.NewEarthlyParser()
	earthfile, err := parser.Parse(c.Path)
	if err != nil {
		return err
	}

	images, err := earthfile.GetImages(c.Target)
	if err != nil {
		return err
	}

	if c.JSONOutput {
		jsonImages, err := json.Marshal(images)
		if err != nil {
			return err
		}
		fmt.Println(string(jsonImages))
		return nil
	}

	for _, image := range images {
		fmt.Println(image)
	}

	return nil
}

type scanCmd struct {
	JSONOutput bool     `short:"j" long:"json"   help:"Output in JSON format"`
	Images     bool     `short:"i" long:"images" help:"Also output images for the target of each Earthfile (requires -t option)"`
	Paths      []string `                        help:"paths to scan for Earthfiles"                                             arg:"" type:"path"`
	Target     string   `short:"t"               help:"filter by Earthfiles that include this target"                                               default:""`
}

func (c *scanCmd) Run() error {
	parser := parsers.NewEarthlyParser()
	scanner := scanners.NewFileScanner(c.Paths, parser, afero.NewOsFs())

	var files []pkg.Earthfile
	var err error
	if c.Target != "" {
		files, err = scanner.ScanForTarget(c.Target)
	} else {
		files, err = scanner.Scan()
	}

	if err != nil {
		return err
	}

	if c.Images {
		if c.Target == "" {
			return fmt.Errorf(
				"the --images (-i) option requires the --target (-t) option",
			)
		}

		var output = make(map[string][]string)

		for _, file := range files {
			images, err := file.GetImages(c.Target)
			if err != nil {
				return err
			}

			output[filepath.Dir(file.Path)] = images
		}

		if c.JSONOutput {
			var outFinal []interface{}
			for path, images := range output {
				out := struct {
					Images []string `json:"images"`
					Path   string   `json:"path"`
				}{
					Images: images,
					Path:   path,
				}
				outFinal = append(outFinal, out)
			}
			jsonOutput, err := json.Marshal(outFinal)
			if err != nil {
				return err
			}
			fmt.Println(string(jsonOutput))
		} else {
			for path, images := range output {
				fmt.Printf("%s %s\n", path, strings.Join(images, ","))
			}
		}

		return nil
	}

	if c.JSONOutput {
		var paths []string
		for _, file := range files {
			paths = append(paths, filepath.Dir(file.Path))
		}
		jsonFiles, err := json.Marshal(paths)
		if err != nil {
			return err
		}
		fmt.Println(string(jsonFiles))
	} else {
		for _, file := range files {
			fmt.Println(filepath.Dir(file.Path))
		}
	}

	return nil
}

func main() {
	ctx := kong.Parse(&cli)
	err := ctx.Run()
	ctx.FatalIfErrorf(err)
	os.Exit(0)
}
