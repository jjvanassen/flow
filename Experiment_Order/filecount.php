<?php
$directory = "results/";
$filecount = 0;
$files = glob($directory . "*.csv");
if ($files){
 $filecount = count($files);
}
echo json_encode($filecount);
?>
