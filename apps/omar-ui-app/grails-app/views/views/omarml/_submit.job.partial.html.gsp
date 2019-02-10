<div class="modal-header">
  <span><i class="fa fa-share-alt"></i>&nbsp;&nbsp;Run Detections</span>
</div>

<div class="modal-body" id="image-share-modal-input">
  Image DB ID:&nbsp;<input size="65" ng-model="vm.imageId" class="ng-pristine ng-valid ng-touched" autofocus readonly></input><br>
  Model:&nbsp;<select id="model-dropdown" name="model" ></select><br>
  Confidence:&nbsp;<input size="3" type="number" min="5" max="100" value="70" class="ng-pristine ng-valid ng-touched"></input><br>
  Non-Max Suppression:&nbsp;<input size="3" type="number" min="5" max="100" value="35" class="ng-pristine ng-valid ng-touched"></input><br>
</div>

<div class="modal-footer">
  <a class="btn btn-primary" ng-href="" target="_blank">
        <i class="fa fa-cog" style="cursor: pointer;"></i>&nbsp;Run Job&nbsp;&nbsp;
  </a>&nbsp;&nbsp;

  <button class="btn btn-warning" type="button" ng-click="vm.close()">Close</button>
</div>
