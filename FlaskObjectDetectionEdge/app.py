import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory,Response
from werkzeug import secure_filename
import numpy as np
import os
import six.moves.urllib as urllib
import sys
import tensorflow as tf
from collections import defaultdict
from io import StringIO
from PIL import Image
import time
sys.path.append("..")
from utils import label_map_util
from utils import visualization_utils as vis_util
import object_detection_api
MODEL_NAME = 'ssd_mobilenet_v1_coco_11_06_2017'
PATH_TO_CKPT = MODEL_NAME + '/frozen_inference_graph.pb'
PATH_TO_LABELS = os.path.join('data', 'mscoco_label_map.pbtxt')
NUM_CLASSES = 90

detection_graph = tf.Graph()
with detection_graph.as_default():
  od_graph_def = tf.GraphDef()
  with tf.gfile.GFile(PATH_TO_CKPT, 'rb') as fid:
    serialized_graph = fid.read()
    od_graph_def.ParseFromString(serialized_graph)
    tf.import_graph_def(od_graph_def, name='')
label_map = label_map_util.load_labelmap(PATH_TO_LABELS)
categories = label_map_util.convert_label_map_to_categories(label_map, max_num_classes=NUM_CLASSES, use_display_name=True)
category_index = label_map_util.create_category_index(categories)


def load_image_into_numpy_array(image):
  (im_width, im_height) = image.size
  return np.array(image.getdata()).reshape(
      (im_height, im_width, 3)).astype(np.uint8)


app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['ALLOWED_EXTENSIONS'] = set(['png', 'jpg', 'jpeg'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/local')
def local():
    return Response(open('./static/local.html').read(), mimetype="text/html")
    
@app.route('/assets/<path:filename>', methods=['GET'])
def download(filename):
   uploads = './static/assets/'
   return send_from_directory(directory=uploads, filename=filename, as_attachment=True)   

@app.route('/model/predict', methods=['POST'])
def image():
    startTime = time.time()*1000
    # try:
    image_file = request.files['image']  # get the image

    # Set an image confidence threshold value to limit returned data
    threshold = request.form.get('threshold')
    requestTimestamp = request.form.get('requestTimestamp')
    if requestTimestamp is None:
        requestTimestamp=0
    print "requestTimestamp" ,float(requestTimestamp)
    print "requestTime" ,startTime-float(requestTimestamp)
    if threshold is None:
        threshold = 0.5
    else:
        threshold = float(threshold)

    # finally run the image through tensor flow object detection`
    image_object = Image.open(image_file)
    image_object.thumbnail((300,300), Image.ANTIALIAS)
    objects = object_detection_api.get_objects(image_object, threshold,float(requestTimestamp),startTime)  
    return objects

    # except Exception as e:
    #     print('POST /image error: %e' % e)
    #     return e

@app.route('/upload', methods=['POST'])
def upload():
    image_file = request.files['file']  # get the image
    threshold = 0.5
    # finally run the image through tensor flow object detection`
    image_object = Image.open(image_file)
    image_object.thumbnail((200,200), Image.ANTIALIAS)
    objects = object_detection_api.get_objects(image_object, threshold)
    return objects

# @app.route('/uploads/<filename>')
# def uploaded_file(filename):
#     PATH_TO_TEST_IMAGES_DIR = app.config['UPLOAD_FOLDER']
#     TEST_IMAGE_PATHS = [ os.path.join(PATH_TO_TEST_IMAGES_DIR,filename.format(i)) for i in range(1, 2) ]
#     IMAGE_SIZE = (12, 8)

#     with detection_graph.as_default():
#         with tf.Session(graph=detection_graph) as sess:
#             for image_path in TEST_IMAGE_PATHS:
#                 image = Image.open(image_path)
#                 image_np = load_image_into_numpy_array(image)
#                 image_np_expanded = np.expand_dims(image_np, axis=0)
#                 image_tensor = detection_graph.get_tensor_by_name('image_tensor:0')
#                 boxes = detection_graph.get_tensor_by_name('detection_boxes:0')
#                 scores = detection_graph.get_tensor_by_name('detection_scores:0')
#                 classes = detection_graph.get_tensor_by_name('detection_classes:0')
#                 num_detections = detection_graph.get_tensor_by_name('num_detections:0')
#                 (boxes, scores, classes, num_detections) = sess.run(
#                     [boxes, scores, classes, num_detections],
#                     feed_dict={image_tensor: image_np_expanded})
#                 vis_util.visualize_boxes_and_labels_on_image_array(
#                     image_np,
#                     np.squeeze(boxes),
#                     np.squeeze(classes).astype(np.int32),
#                     np.squeeze(scores),
#                     category_index,
#                     use_normalized_coordinates=True,
#                     line_thickness=8)
#                 im = Image.fromarray(image_np)
#                 im.save('uploads/'+filename)

#     return send_from_directory(app.config['UPLOAD_FOLDER'],
#                                filename)
if __name__ == '__main__':
    app.run(debug=False,host='0.0.0.0',port=5000, threaded=True)

