//
// editor ui
//
skyshares.editor = {
  //
  // runtime properties
  //
  type: '',
  data: [],
  init: function () {
    const values = window?.location?.href?.split('/editor/new/')
    skyshares.editor.type = values ? values[1] : ''
    console.log('type', skyshares.editor.type)

    var editor = document.getElementById('editor')
    if (editor) {
      editor.onsubmit = function (e) {
        skyshares.editor.save()
        return false
      }
    }
    //
    // initialise local data
    //
    if (document.getElementById('dataid')) {
      switch (type) {
        case 'dataset':
          var data_table = document.getElementById('displayarea')
          if (data_table) {
            var data_rows = data_table.rows
            skyshares.editor.data = []
            for (var row = 0; row < data_rows.length; row++) {
              var row_data = []
              for (var col = 0; col < data_rows[row].children.length; col++) {
                row_data.push(data_rows[row].children[col].innerHTML)
              }
              skyshares.editor.data.push(row_data)
            }
          }
          break
      }
    }
  },
  //
  //
  //
  import: function () {
    var fileInput = document.getElementById('csvfile')
    if (fileInput) {
      var types = ['text.*']
      skyshares.filereader.readfile(fileInput, types, {
        onload: function (evt) {
          var table = document.getElementById('displayarea')
          var controls = document.getElementById('datacontrols')
          table.innerHTML = ''
          var reader = evt.target
          var data = skyshares.editor.csvtodata(reader.result)
          skyshares.editor.renderdata(table, data)
          //
          // initialise controls
          //
          function initControl(name, min, max, value) {
            var control = document.getElementById(name)
            if (control) {
              control.min = min
              control.max = max
              control.value = value
            }
          }
          initControl('headerrow', 0, data.length, 0)
          initControl('indexcolumn', 0, data[0].length, 0)
          initControl('datastartrow', 0, data.length, 0)
          initControl('dataendrow', 0, data.length, 0)
          initControl('datastartcolumn', 0, data[0].length, 0)
          initControl('dataendcolumn', 0, data[0].length, 0)

          controls.style.visibility = 'visible'

          skyshares.editor.data = data
        },
        onerror: function (evt) {
          alert(
            'Error reading data : ' +
              skyshares.filereader.errordescription(evt.target.error)
          )
        }
      })
    }
  },
  csvtodata: function (csv) {
    var output = []
    //
    //
    //
    var rows = csv.split('\n')
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      output[i] = []
      var c = 0
      var r = 0
      while (c < row.length) {
        var col = new String()
        var inquotes = false
        if (row[c] != ',') {
          while ((inquotes || row[c] != ',') && c < row.length) {
            if (row[c] == '"') {
              inquotes = !inquotes
            } else {
              col = col + row[c]
            }
            c++
          }
          //
          // skip delimiter
          //
          c++
        } else {
          // empty column
          c++
        }
        output[i][r] = col
        r++
      }
    }
    return output
  },
  renderdata: function (table, data) {
    //
    // create caption
    //
    var caption = document.createElement('caption')
    caption.innerText = 'Data'
    table.appendChild(caption)
    //
    // create header
    //
    if (data.length > 0) {
      var header = document.createElement('thead')
      var row = document.createElement('tr')
      var col
      for (var i = -1; i < data[0].length; i++) {
        col = document.createElement('th')
        if (i >= 0) {
          col.innerText = i.toString()
        }
        row.appendChild(col)
      }
      header.appendChild(row)
      table.appendChild(header)
      var body = document.createElement('tbody')
      for (var i = 0; i < data.length; i++) {
        if (data[i].length > 0) {
          var row = document.createElement('tr')
          row.classList.add('data')
          row.classList.add(i % 2 ? 'odd' : 'even')
          col = document.createElement('th')
          col.innerText = i.toString()
          row.appendChild(col)
          for (var j = 0; j < data[i].length; j++) {
            col = document.createElement('td')
            col.classList.add('data')
            col.innerText = data[i][j]
            row.appendChild(col)
          }
          body.appendChild(row)
        }
      }
      table.appendChild(body)
    }
  },
  save: function () {
    switch (skyshares.editor.type) {
      case 'constant':
        skyshares.editor.saveconstant()
        break
      case 'variable':
        skyshares.editor.savevariable()
        break
      case 'dataset':
        skyshares.editor.savedataset()
        break
      case 'function':
        skyshares.editor.savefunction()
        break
      case 'group':
        skyshares.editor.savegroup()
        break
    }
  },
  getmetadata: function (type) {
    //
    // return common data
    //
    return {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      type: type
    }
  },
  savedata: function (json) {
    //
    // save
    //
    var dataid = document.getElementById('dataid')
    if (dataid) {
      var url = '/data/' + dataid.value
      skyshares.rest.put(url, json, {
        onloadend: function (e) {
          var request = e.target
          if (request.status === 200) {
            alert('Changes to ' + json.name + ' saved to database!')
            window.location = '/admin'
          } else {
            alert(
              'Failed to save ' +
                json.name +
                ' : ' +
                request.status +
                ' : ' +
                request.statusText
            )
          }
        },
        onerror: function (e) {
          var message = e.target
          alert(
            'Failed to save ' +
              json.name +
              ' : ' +
              request.status +
              ' : ' +
              request.statusText
          )
        }
      })
    } else {
      skyshares.rest.post('/data', json, {
        onloadend: function (e) {
          var request = e.target
          if (request.status === 200) {
            alert(json.name + ' added to database!')
            window.location = '/admin'
          } else {
            alert(
              'Failed to add ' +
                json.name +
                ' : ' +
                request.status +
                ' : ' +
                request.statusText
            )
          }
        },
        onerror: function (e) {
          var message = e.target
          alert(
            'Failed to add ' +
              json.name +
              ' : ' +
              request.status +
              ' : ' +
              request.statusText
          )
        }
      })
    }
  },
  savedataset: function () {
    //
    // initialise json with common data
    //
    var json = skyshares.editor.getmetadata('dataset')
    json.index = {
      type: 'ISO'
    }
    json.members = []
    //
    //
    //
    var headerrow = 0
    var indexcolumn = 0
    var datastartrow = 0
    var dataendrow = 0
    var datastartcolumn = 0
    var dataendcolumn = 0
    if (document.getElementById('dataid')) {
      var data_table = document.getElementById('displayarea')
      if (data_table) {
        var data_rows = data_table.rows
        skyshares.editor.data = []
        for (var row = 0; row < data_rows.length; row++) {
          var row_data = []
          for (var col = 0; col < data_rows[row].children.length; col++) {
            row_data.push(data_rows[row].children[col].innerHTML)
          }
          skyshares.editor.data.push(row_data)
        }
        headerrow = 0
        indexcolumn = 0
        datastartrow = 1
        dataendrow = data_rows.length - 1
        datastartcolumn = 1
        dataendcolumn = skyshares.editor.data[0].length - 1
      }
    } else {
      //
      // TODO: sparse data ( or uneven progression in x ), index should include x value of data entry
      // Example of this is MAC data which has entries for 2010, 2020, 2050
      // possibly implement this as x/y data????
      //
      //
      // get member locations within data
      //
      function getControlValue(name) {
        var control = document.getElementById(name)
        if (control) {
          return parseInt(control.value)
        }
        return undefined
      }
      var headerrow = getControlValue('headerrow')
      var indexcolumn = getControlValue('indexcolumn')
      var datastartrow = getControlValue('datastartrow')
      var dataendrow = getControlValue('dataendrow')
      var datastartcolumn = getControlValue('datastartcolumn')
      var dataendcolumn = getControlValue('dataendcolumn')
    }
    var member_index = {
      type: 'DATE',
      min_index: parseInt(skyshares.editor.data[headerrow][datastartcolumn]),
      max_index: parseInt(skyshares.editor.data[headerrow][dataendcolumn])
    }
    var multiplier = document.getElementById('multiplier')
    multiplier = multiplier ? parseFloat(multiplier.value) : 1.0
    for (var i = datastartrow; i <= dataendrow; i++) {
      var member = {
        iso: skyshares.editor.data[i][indexcolumn],
        index: member_index,
        dimension: 1,
        data: []
      }

      for (var j = datastartcolumn; j <= dataendcolumn; j++) {
        var number_string = skyshares.editor.data[i][j].replace(/[^0-9.]/gi, '')
        if (number_string.length == 0) number_string = '0'
        member.data.push(parseFloat(number_string) * multiplier)
      }
      json.members.push(member)
    }
    //
    // save
    //
    skyshares.editor.savedata(json)
  },
  savefunction: function () {
    //
    // initialise json with common data
    //
    var json = skyshares.editor.getmetadata('function')
    //
    // get source
    //
    json.source = document.getElementById('source').value
    //
    // save
    //
    skyshares.editor.savedata(json)
  },
  savevariable: function () {
    //
    // initialise json with common data
    //
    var json = skyshares.editor.getmetadata('variable')
    //
    // get value
    //
    json.value = document.getElementById('value').value
    //
    // get range
    //
    json.min_value = document.getElementById('min_value').value
    json.max_value = document.getElementById('max_value').value
    //
    // save
    //
    skyshares.editor.savedata(json)
  },
  saveconstant: function () {
    //
    // initialise json with common data
    //
    var json = skyshares.editor.getmetadata('constant')
    //
    // get value
    //
    json.value = document.getElementById('value').value
    //
    // save
    //
    skyshares.editor.savedata(json)
  },
  savegroup: function () {
    //
    // initialise json with common data
    //
    var json = skyshares.editor.getmetadata('group')
    //
    // get group members
    //
    json.members = document.getElementById('members').value.split(',')
    //
    // save
    //
    skyshares.editor.savedata(json)
  },
  //
  //
  //
  evaluatefunction: function () {
    //
    // get source
    //
    var source = document.getElementById('source').value
    //
    //
    //
    var mathjsfunction = skyshares.math.evaluatefunction(source)
    var compiled_function =
      mathjsfunction.scope[mathjsfunction.function_name].bind(mathjsfunction)
    //
    //
    //
    var evaluation = document.createElement('div')
    evaluation.style.position = 'absolute'
    evaluation.style.top = '16px'
    evaluation.style.left = '16px'
    evaluation.style.right = '16px'
    evaluation.style.padding = '8px'
    evaluation.style.webkitUserSelect = 'text'

    var p = document.createElement('p')
    p.innerHTML = source
    evaluation.appendChild(p)
    for (var i = 1; i < mathjsfunction.parameters.length; i++) {
      p = document.createElement('p')
      p.innerHTML += mathjsfunction.parameters[i] + ' : '
      p.innerHTML +=
        ' min <input id="' +
        mathjsfunction.parameters[i] +
        '-min" type="number" value="0" />'
      p.innerHTML +=
        ' max <input id="' +
        mathjsfunction.parameters[i] +
        '-max" type="number" value="0" />'
      p.innerHTML +=
        ' step <input id="' +
        mathjsfunction.parameters[i] +
        '-step" type="number" value="1.0" />'
      evaluation.appendChild(p)
    }
    var graph = document.createElement('input')
    graph.type = 'button'
    graph.value = 'graph'
    graph.onclick = function (e) {
      try {
        var content = document.getElementById('evaluation.content')
        content.innerHTML = ''
        var min_max = []
        for (var i = 1; i < mathjsfunction.parameters.length; i++) {
          min_max.push({
            min: parseFloat(
              document.getElementById(mathjsfunction.parameters[i] + '-min')
                .value
            ),
            max: parseFloat(
              document.getElementById(mathjsfunction.parameters[i] + '-max')
                .value
            ),
            step: parseFloat(
              document.getElementById(mathjsfunction.parameters[i] + '-step')
                .value
            )
          })
        }
        //
        // pre-flight minmax values
        //
        var values = []
        var min = Number.MAX_VALUE
        var max = Number.MIN_VALUE
        var range = max - min
        if (min_max.length == 1) {
          for (
            var i = min_max[0].min;
            i <= min_max[0].max;
            i += min_max[0].step
          ) {
            var value = mathjsfunction.scope[mathjsfunction.function_name](i)
            if (value < min) min = value
            if (value > max) max = value
            values.push(value)
          }
        } else if (min_max.length == 2) {
          for (
            var i = min_max[0].min;
            i <= min_max[0].max;
            i += min_max[0].step
          ) {
            values.push([])
            for (
              var t = min_max[1].min;
              t <= min_max[1].max;
              t += min_max[1].step
            ) {
              var value = mathjsfunction.scope[mathjsfunction.function_name](
                i,
                t
              )
              if (value < min) min = value
              if (value > max) max = value
              values[values.length - 1].push(value)
            }
          }
        } else {
          content.innerHTML =
            'Unable to evaluate at present, please check back later'
          return
        }
        range = max - min
        //
        // create canvas and context
        //
        var canvas = document.createElement('canvas')
        canvas.width = 720
        canvas.height = 512
        var context = canvas.getContext('2d')
        //
        //
        //
        context.strokeStyle = 'black'
        context.fillStyle = 'white'
        //
        //
        //
        context.fillRect(0, 0, canvas.width, canvas.height)
        //
        //
        //
        var margin = 80
        var render_rect = {
          x: 100,
          y: 40,
          width: canvas.width - 100 * 2,
          height: canvas.height - 40 * 2
        }
        //
        // render axis
        //
        context.beginPath()
        context.moveTo(render_rect.x, render_rect.y)
        context.lineTo(render_rect.x, render_rect.y + render_rect.height)
        context.lineTo(
          render_rect.x + render_rect.width,
          render_rect.y + render_rect.height
        )
        context.stroke()
        context.fillStyle = 'black'
        context.fillText(mathjsfunction.function_name, 10, render_rect.y - 20)

        var y = render_rect.y
        var y_incr = render_rect.height / 4.0
        var val_incr = (max - min) / 4.0
        context.textBaseline = 'middle'
        context.textAlign = 'right'
        for (var label = max; label >= min; label -= val_incr) {
          context.fillText(label.toFixed(2) + ' -', render_rect.x, y)
          y += y_incr
        }
        var t_min = min_max.length == 1 ? min_max[0].min : min_max[1].min
        var t_max = min_max.length == 1 ? min_max[0].max : min_max[1].max
        var t_incr = (t_max - t_min) / 10.0
        var x_incr = render_rect.width / 10.0
        var x = render_rect.x
        context.textBaseline = 'top'
        context.textAlign = 'center'
        for (var label = t_min; label <= t_max; label += t_incr) {
          context.fillText(label, x, render_rect.y + render_rect.height)
          x += x_incr
        }
        //
        // render values
        //
        if (min_max.length == 1) {
          context.beginPath()
          for (var t = 0; t < values.length; t++) {
            var x = render_rect.x + render_rect.width * (t / values.length)
            var y =
              render_rect.y +
              (render_rect.height -
                (render_rect.height * (values[t] - min)) / range)
            if (t == 0) {
              context.moveTo(x, y)
            } else {
              context.lineTo(x, y)
            }
          }
          context.stroke()
        } else {
          for (var i = 0; i < values.length; i++) {
            context.beginPath()
            for (var t = 0; t < values[i].length; t++) {
              var x = render_rect.x + render_rect.width * (t / values[i].length)
              var y =
                render_rect.y +
                (render_rect.height -
                  (render_rect.height * (values[i][t] - min)) / range)
              if (t == 0) {
                context.moveTo(x, y)
              } else {
                context.lineTo(x, y)
              }
            }
            context.stroke()
          }
        }
        content.appendChild(canvas)
      } catch (err) {
        alert('Unable to graph : ' + err.message)
      }
    }
    evaluation.appendChild(graph)
    var table = document.createElement('input')
    table.type = 'button'
    table.value = 'table'
    table.onclick = function (e) {
      try {
        var content = document.getElementById('evaluation.content')
        content.innerHTML = ''
        var min_max = []
        for (var i = 1; i < mathjsfunction.parameters.length; i++) {
          min_max.push({
            min: parseFloat(
              document.getElementById(mathjsfunction.parameters[i] + '-min')
                .value
            ),
            max: parseFloat(
              document.getElementById(mathjsfunction.parameters[i] + '-max')
                .value
            ),
            step: parseFloat(
              document.getElementById(mathjsfunction.parameters[i] + '-step')
                .value
            )
          })
        }

        if (min_max.length == 0) {
          content.innerHTML +=
            mathjsfunction.function_name +
            '() = ' +
            mathjsfunction.scope[mathjsfunction.function_name]() +
            '<br />'
        } else if (min_max.length == 1) {
          for (
            var i = min_max[0].min;
            i <= min_max[0].max;
            i += min_max[0].step
          ) {
            content.innerHTML +=
              mathjsfunction.function_name +
              '( ' +
              i +
              ' ) = ' +
              mathjsfunction.scope[mathjsfunction.function_name](i) +
              '<br />'
          }
        } else if (min_max.length == 2) {
          for (
            var i = min_max[0].min;
            i <= min_max[0].max;
            i += min_max[0].step
          ) {
            for (
              var t = min_max[1].min;
              t <= min_max[1].max;
              t += min_max[1].step
            ) {
              content.innerHTML +=
                mathjsfunction.function_name +
                '( ' +
                i +
                ', ' +
                t +
                ' ) = ' +
                mathjsfunction.scope[mathjsfunction.function_name](i, t) +
                '<br />'
            }
          }
        } else {
          content.innerHTML =
            'Unable to evaluate at present, please check back later'
        }
      } catch (err) {
        alert('Unable to table : ' + err.message)
      }
    }
    evaluation.appendChild(table)
    var content = document.createElement('div')
    content.id = 'evaluation.content'
    evaluation.appendChild(content)
    //
    // build and popup parameter form
    //
    var dialog = {
      width: 720,
      height: 512,
      header: 'Evaluating ' + mathjsfunction.function_name,
      body: evaluation
    }
    skyshares.dialogbox.show(dialog)
  },
  multiplydataset: function () {
    var data = skyshares.editor.data
    if (data) {
      var multiplier = document.getElementById('multiplier')
      multiplier = multiplier ? parseFloat(multiplier.value) : 1.0
      // skip row and column headers
      for (var i = 2; i < data.length; i++) {
        for (var j = 1; j < data[i].length; j++) {
          data[i][j] = parseFloat(data[i][j]) * multiplier
        }
      }
      var table = document.getElementById('displayarea')
      table.innerHTML = ''
      skyshares.editor.renderdata(table, data)
    }
  }
}
